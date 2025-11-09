#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { validateDomainName, validateSSLCertificate, validatePrivateKey } = require('./validation')

const configPath = path.join(__dirname, '..', 'deploy.config.json')

// Check if config is initialized
if (!fs.existsSync(configPath)) {
  console.error('❌ Configuration not initialized')
  console.error('Please run: yarn self-deploy')
  process.exit(1)
}

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  if (!config.self) {
    console.error('❌ Configuration not initialized')
    console.error('Please run: yarn self-deploy')
    process.exit(1)
  }
} catch {
  console.error('❌ Configuration not initialized')
  console.error('Please run: yarn self-deploy')
  process.exit(1)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise(resolve => rl.question(query, resolve))

const readConfig = () => {
  if (!fs.existsSync(configPath)) {
    console.error('❌ Configuration not found: deploy.config.json')
    console.error('Stopping all PM2 processes...')

    try {
      require('child_process').execSync('pm2 kill', { stdio: 'pipe' })
      console.log('All PM2 processes stopped')
    } catch (err) {
      console.warn('⚠️  Could not stop PM2 processes')
    }

    throw new Error('Configuration not initialized. Please run: yarn self-deploy')
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(content)

    if (!config.self || !config.paths) {
      console.error('❌ Invalid configuration: Missing required fields')
      console.error('Stopping all PM2 processes...')

      try {
        require('child_process').execSync('pm2 kill', { stdio: 'pipe' })
        console.log('All PM2 processes stopped')
      } catch (err) {
        console.warn('⚠️  Could not stop PM2 processes')
      }

      throw new Error('Configuration not initialized. Please run: yarn self-deploy')
    }

    return config
  } catch (err) {
    if (err.message.includes('Configuration not initialized')) {
      throw err
    }

    console.error('❌ Failed to read configuration: ' + err.message)
    console.error('Stopping all PM2 processes...')

    try {
      require('child_process').execSync('pm2 kill', { stdio: 'pipe' })
      console.log('All PM2 processes stopped')
    } catch (killErr) {
      console.warn('⚠️  Could not stop PM2 processes')
    }

    throw new Error('Configuration not initialized. Please run: yarn self-deploy')
  }
}

const writeConfig = (config) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')
}

const createCertificateDirectory = (domain, homePath) => {
  const certificatesDir = path.join(homePath, 'certificate')
  const domainDir = path.join(certificatesDir, domain)
  if (!fs.existsSync(domainDir)) {
    fs.mkdirSync(domainDir, { recursive: true })
  }
  return domainDir
}

const main = async () => {
  try {
    console.log('\n--- Add New Domain ---\n')

    const domainName = await question('Domain name (e.g., example.com): ')
    let validatedDomain
    try {
      validatedDomain = validateDomainName(domainName)
    } catch (err) {
      console.error(`Error: ${err.message}`)
      rl.close()
      process.exit(1)
    }

    const config = readConfig()
    if (config.domains && config.domains.some(d => d.name === validatedDomain)) {
      console.error(`Error: Domain "${validatedDomain}" already exists`)
      rl.close()
      process.exit(1)
    }

    console.log('\nPaste your SSL certificate (certificate.crt content):')
    console.log('(Enter an empty line when done)\n')
    let certificate = ''
    while (true) {
      const line = await question('')
      if (line === '') break
      certificate += (certificate ? '\n' : '') + line
    }

    let validatedCert
    try {
      validatedCert = validateSSLCertificate(certificate)
    } catch (err) {
      console.error(`Error: ${err.message}`)
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

    let validatedKey
    try {
      validatedKey = validatePrivateKey(privateKey)
    } catch (err) {
      console.error(`Error: ${err.message}`)
      rl.close()
      process.exit(1)
    }

    const domainDir = createCertificateDirectory(validatedDomain, config.paths.home)

    const certPath = path.join(domainDir, 'certificate.crt')
    const keyPath = path.join(domainDir, 'private.key')

    fs.writeFileSync(certPath, validatedCert + '\n')
    fs.writeFileSync(keyPath, validatedKey + '\n')

    if (!config.domains) {
      config.domains = []
    }

    config.domains.push({
      name: validatedDomain
    })

    writeConfig(config)

    console.log(`\n✓ Domain "${validatedDomain}" added successfully!`)
    console.log(`\nCertificate files created:`)
    console.log(`  Certificate: ${certPath}`)
    console.log(`  Private key: ${keyPath}`)

    rl.close()
  } catch (error) {
    console.error('Error:', error.message)
    rl.close()
    process.exit(1)
  }
}

main()
