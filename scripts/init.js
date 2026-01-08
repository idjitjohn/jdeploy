#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const crypto = require('crypto')
const readline = require('readline')
const fs = require('fs')
const path = require('path')
const os = require('os')

// Config file path in user home
const CONFIG_FILE = path.join(os.homedir(), '.jdeploy.json')

// Default home directory
const DEFAULT_HOME = path.join(os.homedir(), 'jdeploy')

// Config object
let config = null

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex')
}

function generatePassword(length = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

// Encrypt with secret (AES-256-CBC + base64)
function encrypt(text, secret) {
  const key = crypto.createHash('sha256').update(secret).digest()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return iv.toString('base64') + ':' + encrypted
}

// Decrypt with secret
function decrypt(encrypted, secret) {
  const [ivBase64, data] = encrypted.split(':')
  const key = crypto.createHash('sha256').update(secret).digest()
  const iv = Buffer.from(ivBase64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(data, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
      return true
    } catch {
      return false
    }
  }
  return false
}

function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

function getMongoPassword() {
  if (!config || !config.secret || !config.mongo_pass) {
    return null
  }
  try {
    return decrypt(config.mongo_pass, config.secret)
  } catch {
    return null
  }
}

function setMongoPassword(password) {
  if (!config.secret) {
    config.secret = generateSecret()
  }
  config.mongo_pass = encrypt(password, config.secret)
  saveConfig()
}

function getAdminConnectionString(password) {
  const encodedPassword = encodeURIComponent(password)
  return `mongodb://admin:${encodedPassword}@localhost:27017/admin?authMechanism=DEFAULT&authSource=admin`
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', ...options })
  } catch (error) {
    throw new Error(error.stderr || error.message)
  }
}

function askPassword(prompt = 'Enter sudo password: ') {
  return new Promise((resolve) => {
    const stdin = process.stdin
    const stdout = process.stdout

    stdout.write(prompt)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')

    let password = ''
    const onData = (ch) => {
      if (ch === '\n' || ch === '\r') {
        stdin.setRawMode(false)
        stdin.pause()
        stdin.removeListener('data', onData)
        stdout.write('\n')
        resolve(password)
      } else if (ch === '\u0003') {
        // Ctrl+C
        process.exit()
      } else if (ch === '\u007F') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1)
        }
      } else {
        password += ch
      }
    }
    stdin.on('data', onData)
  })
}

async function validateSudo(password) {
  return new Promise((resolve) => {
    const proc = spawn('sudo', ['-S', '-v'], { stdio: ['pipe', 'pipe', 'pipe'] })
    proc.stdin.write(password + '\n')
    proc.stdin.end()
    proc.on('close', (code) => resolve(code === 0))
  })
}

function execSudo(cmd, password) {
  return new Promise((resolve, reject) => {
    const proc = spawn('sudo', ['-S', 'bash', '-c', cmd], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => { stdout += data })
    proc.stderr.on('data', (data) => { stderr += data })

    proc.stdin.write(password + '\n')
    proc.stdin.end()

    proc.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr || `Command failed with code ${code}`))
    })
  })
}

async function findMongodConf(adminPassword = null) {
  // Try with auth first if password provided
  if (adminPassword) {
    try {
      const result = execSync(`mongosh --quiet -u admin -p "${adminPassword}" --authenticationDatabase admin --eval "db.serverCmdLineOpts().parsed.config"`, { encoding: 'utf-8', stdio: 'pipe' })
      const configPath = result.trim()
      if (configPath && configPath !== 'undefined') {
        return configPath
      }
    } catch {
      // Auth failed or command failed
    }
  }

  // Try without auth (works when security is disabled)
  try {
    const result = execSync('mongosh --quiet --eval "db.serverCmdLineOpts().parsed.config"', { encoding: 'utf-8', stdio: 'pipe' })
    const configPath = result.trim()
    if (configPath && configPath !== 'undefined') {
      return configPath
    }
  } catch {
    // Security might be enabled
  }

  // Fallback to common locations
  const commonPaths = [
    '/opt/homebrew/etc/mongod.conf',
    '/usr/local/etc/mongod.conf',
    '/etc/mongod.conf',
    '/etc/mongodb.conf'
  ]
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p
    }
  }

  return null
}

function checkMongoSecurityInConfig(mongodConf, sudoPassword) {
  return new Promise(async (resolve) => {
    try {
      const content = await execSudo(`cat ${mongodConf}`, sudoPassword)
      resolve(content.includes('authorization: enabled') || content.includes('authorization:enabled'))
    } catch {
      resolve(false)
    }
  })
}

function checkMongoSecurityActive() {
  // Check if security is actually active at runtime
  try {
    execSync('mongosh --quiet --eval "db.serverCmdLineOpts()"', { encoding: 'utf-8', stdio: 'pipe' })
    // Command succeeded without auth = security not active
    return false
  } catch (error) {
    // If error contains "requires authentication", security is active
    if (error.message && error.message.includes('requires authentication')) {
      return true
    }
    // Other error, assume not active
    return false
  }
}

function testMongoAdminPassword(mongoPassword) {
  return new Promise((resolve) => {
    try {
      const evalScript = `db.getSiblingDB('admin').auth('admin', '${mongoPassword}')`
      execSync(`mongosh --quiet --eval "${evalScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
      resolve(true)
    } catch {
      resolve(false)
    }
  })
}

async function disableMongoSecurity(mongodConf, sudoPassword) {
  try {
    // Comment out authorization line (use .bak for macOS sed compatibility)
    await execSudo(`sed -i.bak 's/^\\(\\s*authorization:\\s*enabled\\)/#\\1/' ${mongodConf} && rm -f ${mongodConf}.bak`, sudoPassword)
    return await restartMongoDB(sudoPassword)
  } catch {
    return false
  }
}

async function enableMongoSecurity(mongodConf, sudoPassword) {
  try {
    const content = await execSudo(`cat ${mongodConf}`, sudoPassword)

    // Check if commented authorization exists (use .bak for macOS sed compatibility)
    if (content.includes('#  authorization: enabled') || content.includes('#authorization: enabled')) {
      await execSudo(`sed -i.bak 's/^#\\(\\s*authorization:\\s*enabled\\)/\\1/' ${mongodConf} && rm -f ${mongodConf}.bak`, sudoPassword)
    } else if (content.includes('security:')) {
      await execSudo(`sed -i.bak '/^security:/a\\
  authorization: enabled' ${mongodConf} && rm -f ${mongodConf}.bak`, sudoPassword)
    } else {
      await execSudo(`echo -e '\\nsecurity:\\n  authorization: enabled' >> ${mongodConf}`, sudoPassword)
    }

    return await restartMongoDB(sudoPassword)
  } catch {
    return false
  }
}

function setMongoAdminPassword(newPassword) {
  try {
    // Create or update admin user without auth
    const evalScript = `db.getSiblingDB('admin').createUser({user: 'admin', pwd: '${newPassword}', roles: ['root']})`
    execSync(`mongosh --quiet --eval "${evalScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
    return true
  } catch (error) {
    // User might already exist, try to update
    try {
      const updateScript = `db.getSiblingDB('admin').changeUserPassword('admin', '${newPassword}')`
      execSync(`mongosh --quiet --eval "${updateScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
      return true
    } catch {
      return false
    }
  }
}

async function restartMongoDB(sudoPassword) {
  console.log('Restarting MongoDB service...')
  try {
    // Try brew services first (macOS)
    try {
      execSync('brew services restart mongodb-community', { encoding: 'utf-8', stdio: 'pipe' })
      await new Promise(r => setTimeout(r, 3000))
      return true
    } catch {
      // Not macOS or brew not available
    }

    // Try systemctl (Linux)
    await execSudo('systemctl restart mongod', sudoPassword)
    await new Promise(r => setTimeout(r, 3000))
    return true
  } catch (error) {
    console.error('Failed to restart MongoDB:', error.message)
    return false
  }
}

async function setupMongoAuth(sudoPassword) {
  console.log('\nConfiguring MongoDB authentication...')

  try {
    // Check if we have a stored password in config
    let storedPassword = getMongoPassword()

    // Find mongod.conf location (pass stored password in case security is active)
    const mongodConf = await findMongodConf(storedPassword)
    if (!mongodConf) {
      console.log('MongoDB config not found, skipping...')
      return true
    }
    console.log(`Found MongoDB config at: ${mongodConf}`)

    const securityInConfig = await checkMongoSecurityInConfig(mongodConf, sudoPassword)
    const securityActive = checkMongoSecurityActive()

    // If security is in config but not active, restart MongoDB
    if (securityInConfig && !securityActive) {
      console.log('Security is configured but not active. MongoDB needs a restart.')
      const restarted = await restartMongoDB(sudoPassword)
      if (!restarted) {
        console.error('Failed to restart MongoDB')
        return false
      }
      console.log('MongoDB restarted successfully')
    }

    const securityEnabled = securityInConfig && (securityActive || checkMongoSecurityActive())

    if (securityEnabled) {
      console.log('MongoDB security is enabled')

      // If we have stored password, verify it
      if (storedPassword) {
        const valid = await testMongoAdminPassword(storedPassword)
        if (valid) {
          console.log('Stored MongoDB admin password is valid')
          return true
        }
        console.log('Stored password is invalid')
      }

      // Ask for MongoDB admin password
      const mongoPassword = await askPassword('Enter MongoDB admin password: ')
      const valid = await testMongoAdminPassword(mongoPassword)

      if (valid) {
        // Save valid password
        setMongoPassword(mongoPassword)
        console.log('MongoDB admin password verified and saved')
        return true
      }

      // Password invalid, need to reset
      console.log('Invalid MongoDB password. Resetting admin password...')

      // Disable security temporarily
      console.log('Disabling MongoDB security temporarily...')
      const disabled = await disableMongoSecurity(mongodConf, sudoPassword)
      if (!disabled) {
        console.error('Failed to disable MongoDB security')
        return false
      }

      // Set new password
      let newPassword = await askPassword('Enter new MongoDB admin password (leave empty to generate): ')
      if (!newPassword) {
        newPassword = generatePassword()
        console.log('Generated a strong password for you')
      }
      const passwordSet = setMongoAdminPassword(newPassword)
      if (!passwordSet) {
        console.error('Failed to set MongoDB admin password')
        return false
      }

      // Save password
      setMongoPassword(newPassword)
      console.log('MongoDB admin password set and saved')
      console.log(`\nAdmin connection string:\n${getAdminConnectionString(newPassword)}\n`)

      // Re-enable security
      console.log('Re-enabling MongoDB security...')
      const enabled = await enableMongoSecurity(mongodConf, sudoPassword)
      if (!enabled) {
        console.error('Failed to re-enable MongoDB security')
        return false
      }

      console.log('MongoDB security re-enabled')
      return true
    } else {
      // Security not enabled, set it up
      console.log('MongoDB security is not enabled')

      // Ask for password to set
      let newPassword = await askPassword('Enter MongoDB admin password to set (leave empty to generate): ')
      if (!newPassword) {
        newPassword = generatePassword()
        console.log('Generated a strong password for you')
      }

      // Create admin user
      const passwordSet = setMongoAdminPassword(newPassword)
      if (!passwordSet) {
        console.error('Failed to create MongoDB admin user')
        return false
      }

      // Save password
      setMongoPassword(newPassword)
      console.log('MongoDB admin user created and password saved')
      console.log(`\nAdmin connection string:\n${getAdminConnectionString(newPassword)}\n`)

      // Enable security
      console.log('Enabling MongoDB security...')
      const enabled = await enableMongoSecurity(mongodConf, sudoPassword)
      if (!enabled) {
        console.error('Failed to enable MongoDB security')
        return false
      }

      console.log('MongoDB security enabled')
      return true
    }
  } catch (error) {
    console.error('Failed to configure MongoDB:', error.message)
    return false
  }
}

async function setupSudoers(password) {
  const username = process.env.USER || exec('whoami').trim()

  // Find systemctl path using which
  let systemctlPath = '/bin/systemctl'
  try {
    systemctlPath = exec('which systemctl').trim()
  } catch {
    // Fallback to /bin/systemctl if which fails
  }

  const sudoersLine = `${username} ALL=(ALL) NOPASSWD: ${systemctlPath} * nginx`
  const sudoersFile = `/etc/sudoers.d/${username}-nginx`

  console.log(`\nConfiguring sudoers for user: ${username}`)
  console.log(`Found systemctl at: ${systemctlPath}`)
  console.log(`Adding rule: ${sudoersLine}`)

  try {
    // Check if already configured
    try {
      const existing = await execSudo(`cat ${sudoersFile} 2>/dev/null`, password)
      if (existing.includes(sudoersLine)) {
        console.log('Sudoers rule already configured, skipping...')
        return true
      }
    } catch {
      // File doesn't exist, continue
    }

    // Create sudoers file with proper permissions
    await execSudo(`echo '${sudoersLine}' > ${sudoersFile}`, password)
    await execSudo(`chmod 440 ${sudoersFile}`, password)

    // Validate sudoers syntax
    await execSudo(`visudo -c -f ${sudoersFile}`, password)

    console.log('Sudoers rule added successfully')
    return true
  } catch (error) {
    console.error('Failed to configure sudoers:', error.message)
    return false
  }
}

async function findNginxConf(sudoPassword) {
  // Try nginx -t to find config path
  try {
    const result = await execSudo('nginx -t 2>&1', sudoPassword)
    const match = result.match(/configuration file ([^\s]+)/)
    if (match) {
      return match[1]
    }
  } catch (error) {
    // Try to extract path from error message
    const match = error.message?.match(/configuration file ([^\s]+)/)
    if (match) {
      return match[1]
    }
  }

  // Fallback to common paths
  const commonPaths = [
    '/etc/nginx/nginx.conf',
    '/opt/homebrew/etc/nginx/nginx.conf',
    '/usr/local/etc/nginx/nginx.conf'
  ]
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p
    }
  }

  return null
}

async function setupNginxInclude(sudoPassword) {
  console.log('\nConfiguring Nginx to include app configs...')

  const nginxConf = await findNginxConf(sudoPassword)
  if (!nginxConf) {
    console.log('Nginx config not found, skipping...')
    return true
  }
  console.log(`Found Nginx config at: ${nginxConf}`)

  const appNginxDir = path.join(config.home, 'nginx')
  const includeLine = `include ${appNginxDir}/*.conf;`

  try {
    // Read current nginx config
    const content = await execSudo(`cat ${nginxConf}`, sudoPassword)

    // Check if already included
    if (content.includes(includeLine)) {
      console.log('Nginx include already configured, skipping...')
      return true
    }

    // Find first include line and add our include after it
    const lines = content.split('\n')
    let insertIndex = -1

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('include ')) {
        insertIndex = i + 1
        break
      }
    }

    if (insertIndex === -1) {
      console.log('No include directive found in nginx.conf, skipping...')
      return true
    }

    // Insert our include line
    lines.splice(insertIndex, 0, `    ${includeLine}`)
    const newContent = lines.join('\n')

    // Write back using temp file
    const tempFile = `/tmp/nginx.conf.${Date.now()}`
    fs.writeFileSync(tempFile, newContent, 'utf-8')
    await execSudo(`cp ${tempFile} ${nginxConf}`, sudoPassword)
    fs.unlinkSync(tempFile)

    // Test nginx config and reload
    try {
      await execSudo('nginx -t', sudoPassword)
      console.log('Nginx config validated')
      await execSudo('systemctl restart nginx', sudoPassword)
      console.log('Nginx reloaded')
    } catch (error) {
      console.error('Nginx config test or reload failed:', error.message)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to configure Nginx:', error.message)
    return false
  }
}

async function getHomeDirectory() {
  // First check if config file exists and has home
  if (config && config.home) {
    return config.home
  }

  // Try to get from MongoDB configuration
  try {
    const result = execSync('mongosh --quiet --eval "db.getSiblingDB(\'webhook-deployer\').configurations.findOne()?.home"', {
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim()
    if (result && result !== 'undefined' && result !== 'null') {
      return result
    }
  } catch {
    // DB not accessible or config doesn't exist
  }

  // Ask user for home directory
  const homeDir = await question(`Enter webhooks home directory [${DEFAULT_HOME}]: `)
  return homeDir.trim() || DEFAULT_HOME
}

async function main() {
  console.log('=== Webhook Deployer Initialization ===\n')

  // Load or create config
  const configExists = loadConfig()
  if (configExists) {
    console.log(`Config loaded from ${CONFIG_FILE}`)
  } else {
    console.log('No config found, creating new one...')
    config = {
      secret: generateSecret(),
      home: null,
      mongo_pass: null
    }
  }

  // Get home directory
  const homeDir = await getHomeDirectory()
  config.home = homeDir
  saveConfig()
  console.log(`Using home directory: ${config.home}\n`)

  // Ensure home directory exists
  if (!fs.existsSync(config.home)) {
    console.log(`Creating home directory: ${config.home}`)
    fs.mkdirSync(config.home, { recursive: true })
  }

  const password = await askPassword()

  // Validate sudo password
  console.log('Validating sudo access...')
  const validSudo = await validateSudo(password)
  if (!validSudo) {
    console.error('Invalid sudo password')
    rl.close()
    process.exit(1)
  }
  console.log('Sudo access validated\n')

  // Setup sudoers
  const sudoersOk = await setupSudoers(password)
  if (!sudoersOk) {
    rl.close()
    process.exit(1)
  }

  // Setup MongoDB authentication
  const mongoOk = await setupMongoAuth(password)
  if (!mongoOk) {
    rl.close()
    process.exit(1)
  }

  // Setup Nginx include for app configs
  const nginxOk = await setupNginxInclude(password)
  if (!nginxOk) {
    rl.close()
    process.exit(1)
  }

  rl.close()
  console.log('\n=== Initialization complete ===')
}

main().catch((error) => {
  console.error('Initialization failed:', error.message)
  process.exit(1)
})
