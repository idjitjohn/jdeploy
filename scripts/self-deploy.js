#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const readline = require('readline')
const { validateDomainName, validatePort, validateSubdomain, validateSSLCertificate, validatePrivateKey } = require('./validation')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise(resolve => rl.question(query, resolve))

const configPath = path.join(__dirname, '..', 'deploy.config.json')
const serverPath = path.join(__dirname, '..', 'server.js')

const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`)
const error = (msg) => console.error(`[${new Date().toISOString()}] ERROR: ${msg}`)
const success = (msg) => console.log(`[${new Date().toISOString()}] SUCCESS: ${msg}`)

const readConfig = () => {
  if (!fs.existsSync(configPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(content)

    if (!config.self || !config.paths) {
      console.error('❌ Invalid configuration: Missing required fields')
      throw new Error('Invalid configuration format')
    }

    return config
  } catch (err) {
    console.error('❌ Failed to read configuration: ' + err.message)
    throw new Error('Failed to read configuration')
  }
}

const createInitialConfig = (homeDir) => {
  return {
    paths: {
      home: homeDir,
      nginxAvailable: '/etc/nginx/sites-available/',
      nginxEnabled: '/etc/nginx/sites-enabled/'
    },
    domains: [],
    repositories: [],
    self: null
  }
}

const writeConfig = (config) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')
}

const createDirectories = (config) => {
  log('Creating required directories...')
  const dirs = [
    path.join(config.paths.home, 'code'),
    path.join(config.paths.home, 'release'),
    path.join(config.paths.home, 'certificate'),
    path.join(config.paths.home, 'logs')
  ]

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      log(`Created directory: ${dir}`)
    }
  })
}

const checkDependencies = () => {
  log('Checking dependencies...')
  const deps = ['node', 'yarn', 'git']

  deps.forEach(dep => {
    try {
      execSync(`command -v ${dep} > /dev/null 2>&1`, { shell: '/bin/bash' })
      success(`${dep} is installed`)
    } catch {
      error(`${dep} is not installed`)
      process.exit(1)
    }
  })
}

const installNodeDeps = () => {
  log('Installing Node.js dependencies...')
  try {
    execSync('yarn install', { cwd: path.dirname(configPath), stdio: 'inherit' })
    success('Dependencies installed')
  } catch (err) {
    error(`Failed to install dependencies: ${err.message}`)
    process.exit(1)
  }
}

const setupPM2 = async () => {
  log('Setting up PM2...')
  try {
    execSync('pm2 kill 2>/dev/null', { shell: '/bin/bash' })
  } catch {}

  const pm2ConfigPath = path.join(__dirname, '..', 'ecosystem.config.js')
  const pm2Config = `module.exports = {
  apps: [{
    name: 'webhook-deployer',
    script: '${serverPath}',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    env: {
      NODE_ENV: 'production',
      WEBHOOK_PORT: 3001
    }
  }]
}
`

  fs.writeFileSync(pm2ConfigPath, pm2Config)
  log(`PM2 config created at ${pm2ConfigPath}`)

  try {
    execSync('pm2 start ecosystem.config.js --name webhook-deployer', {
      cwd: path.dirname(configPath),
      stdio: 'inherit'
    })
    success('PM2 application started')
  } catch (err) {
    error(`Failed to start PM2: ${err.message}`)
  }
}

const main = async () => {
  try {
    console.log('\n=== Webhook Deployer Self-Deploy Setup ===\n')

    log('Checking dependencies...')
    checkDependencies()

    log('Initializing configuration...')
    let config = readConfig()
    if (!config) {
      const homeDir = path.join(process.env.HOME || '/home/user', 'deployments')
      config = createInitialConfig(homeDir)
      writeConfig(config)
      success(`Configuration file created: ${configPath}`)
    } else {
      log(`Configuration file already exists: ${configPath}`)
    }

    log('Creating directories...')
    createDirectories(config)

    log('Installing Node.js dependencies...')
    installNodeDeps()

    console.log('\n--- Self-Hosting Configuration ---\n')

    // Check existing configuration
    const hasExistingConfig = config.self && config.self.domain
    let validatedDomain = config.self?.domain
    let webhookSubdomain = config.self?.subdomain || 'webhook'
    let webhookPort = config.self?.port || '50000'
    let validatedCert = null
    let validatedKey = null

    // Skip domain prompt if already configured
    if (!hasExistingConfig) {
      const domain = await question('Self-hosting domain (e.g., webhook.example.com): ')
      try {
        validatedDomain = validateDomainName(domain)
      } catch (err) {
        error(err.message)
        rl.close()
        process.exit(1)
      }
    } else {
      console.log(`✓ Using existing domain: ${validatedDomain}`)
    }

    // Check if certificates exist
    const certDir = path.join(config.paths.home, 'certificate', validatedDomain)
    const certPath = path.join(certDir, 'certificate.crt')
    const keyPath = path.join(certDir, 'private.key')
    const certExists = fs.existsSync(certPath) && fs.existsSync(keyPath)

    // Skip certificate prompt if already exist
    if (!certExists) {
      console.log('\nPaste your SSL certificate (certificate.crt content):')
      console.log('(Enter an empty line when done)\n')
      let certificate = ''
      while (true) {
        const line = await question('')
        if (line === '') break
        certificate += (certificate ? '\n' : '') + line
      }

      try {
        validatedCert = validateSSLCertificate(certificate)
      } catch (err) {
        error(err.message)
        rl.close()
        process.exit(1)
      }

      console.log('\nPaste your private key (private.key content):')
      console.log('(Enter an empty line when done)\n')
      let privateKey = ''
      while (true) {
        const line = await question('')
        if (line === '') break
        privateKey += (privateKey ? '\n' : '') + line
      }

      try {
        validatedKey = validatePrivateKey(privateKey)
      } catch (err) {
        error(err.message)
        rl.close()
        process.exit(1)
      }
    } else {
      console.log(`✓ Using existing certificates from: ${certDir}`)
    }

    // Skip subdomain prompt if already configured
    if (!hasExistingConfig) {
      const subdomain = await question('Subdomain for this service (default: webhook): ')
      if (subdomain.trim()) {
        try {
          webhookSubdomain = validateSubdomain(subdomain)
        } catch (err) {
          error(err.message)
          rl.close()
          process.exit(1)
        }
      }
    } else {
      console.log(`✓ Using existing subdomain: ${webhookSubdomain}`)
    }

    // Skip port prompt if already configured
    if (!hasExistingConfig) {
      const port = await question('Port for webhook service (default: 50000): ')
      if (port.trim()) {
        try {
          webhookPort = validatePort(port)
        } catch (err) {
          error(err.message)
          rl.close()
          process.exit(1)
        }
      }
    } else {
      console.log(`✓ Using existing port: ${webhookPort}`)
    }

    // Create certificate directory if needed
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true })
      log(`Created certificate directory: ${certDir}`)
    }

    // Write certificates only if new ones were provided
    if (validatedCert && validatedKey) {
      fs.writeFileSync(certPath, validatedCert + '\n')
      fs.writeFileSync(keyPath, validatedKey + '\n')
      success(`Certificates saved`)
    }

    config.self = {
      domain: validatedDomain,
      subdomain: webhookSubdomain,
      port: webhookPort
    }

    if (!config.domains) {
      config.domains = []
    }

    config.domains.push({
      name: validatedDomain
    })

    writeConfig(config)
    success('Configuration updated with self-hosting details')

    const setupWebhook = await question('\nSetup webhook nginx reverse proxy? (y/n): ')
    if (setupWebhook.toLowerCase() === 'y') {
      const setupNginxPath = path.join(__dirname, 'setup-nginx.js')
      try {
        execSync(`sudo node ${setupNginxPath} ${domain} ${webhookPort}`, {
          stdio: 'inherit'
        })
      } catch (err) {
        error(`Failed to setup nginx: ${err.message}`)
      }
    }

    const setupPM2Start = await question('\nSetup PM2 for auto-start? (y/n): ')
    if (setupPM2Start.toLowerCase() === 'y') {
      await setupPM2()
      try {
        execSync('sudo pm2 startup && sudo pm2 save', { stdio: 'inherit' })
        success('PM2 auto-start configured')
      } catch (err) {
        log('PM2 auto-start configuration failed - you may need to run manually')
      }
    }

    console.log('\n=== Setup Complete ===\n')
    console.log('Self-hosting configuration:')
    console.log(`  Domain: ${validatedDomain}`)
    console.log(`  Subdomain: ${webhookSubdomain}`)
    console.log(`  Port: ${webhookPort}`)
    console.log(`  Path: ${config.paths.home}`)
    console.log('\nNext steps:')
    console.log('1. Start the listener: yarn start')
    console.log('2. Add first domain: yarn domain')
    console.log('3. Add first repository: yarn repo')
    console.log('4. Configure webhook in GitHub/GitLab settings\n')

    rl.close()
  } catch (err) {
    error(err.message)
    rl.close()
    process.exit(1)
  }
}

main()
