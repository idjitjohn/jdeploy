#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const readline = require('readline')
const fs = require('fs')
const path = require('path')

const MONGO_PASS_FILE = path.join(__dirname, '..', 'mongo.admin.pass')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

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

function checkMongoSecurityEnabled(sudoPassword) {
  return new Promise(async (resolve) => {
    try {
      const mongodConf = '/etc/mongod.conf'
      const content = await execSudo(`cat ${mongodConf}`, sudoPassword)
      resolve(content.includes('authorization: enabled') || content.includes('authorization:enabled'))
    } catch {
      resolve(false)
    }
  })
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

async function disableMongoSecurity(sudoPassword) {
  const mongodConf = '/etc/mongod.conf'
  try {
    // Comment out authorization line
    await execSudo(`sed -i 's/^\\(\\s*authorization:\\s*enabled\\)/#\\1/' ${mongodConf}`, sudoPassword)
    await execSudo('systemctl restart mongod', sudoPassword)
    // Wait for MongoDB to restart
    await new Promise(r => setTimeout(r, 2000))
    return true
  } catch {
    return false
  }
}

async function enableMongoSecurity(sudoPassword) {
  const mongodConf = '/etc/mongod.conf'
  try {
    const content = await execSudo(`cat ${mongodConf}`, sudoPassword)
    
    // Check if commented authorization exists
    if (content.includes('#  authorization: enabled') || content.includes('#authorization: enabled')) {
      await execSudo(`sed -i 's/^#\\(\\s*authorization:\\s*enabled\\)/\\1/' ${mongodConf}`, sudoPassword)
    } else if (content.includes('security:')) {
      await execSudo(`sed -i '/^security:/a\\  authorization: enabled' ${mongodConf}`, sudoPassword)
    } else {
      await execSudo(`echo -e '\\nsecurity:\\n  authorization: enabled' >> ${mongodConf}`, sudoPassword)
    }
    
    await execSudo('systemctl restart mongod', sudoPassword)
    await new Promise(r => setTimeout(r, 2000))
    return true
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

async function setupMongoAuth(sudoPassword) {
  console.log('\nConfiguring MongoDB authentication...')

  try {
    // Check if mongod.conf exists
    try {
      await execSudo('test -f /etc/mongod.conf', sudoPassword)
    } catch {
      console.log('MongoDB config not found, skipping...')
      return true
    }

    const securityEnabled = await checkMongoSecurityEnabled(sudoPassword)
    
    // Check if we have a stored password
    let storedPassword = null
    if (fs.existsSync(MONGO_PASS_FILE)) {
      storedPassword = fs.readFileSync(MONGO_PASS_FILE, 'utf-8').trim()
    }

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
        fs.writeFileSync(MONGO_PASS_FILE, mongoPassword, 'utf-8')
        console.log('MongoDB admin password verified and saved')
        return true
      }

      // Password invalid, need to reset
      console.log('Invalid MongoDB password. Resetting admin password...')
      
      // Disable security temporarily
      console.log('Disabling MongoDB security temporarily...')
      const disabled = await disableMongoSecurity(sudoPassword)
      if (!disabled) {
        console.error('Failed to disable MongoDB security')
        return false
      }

      // Set new password
      const newPassword = await askPassword('Enter new MongoDB admin password: ')
      const passwordSet = setMongoAdminPassword(newPassword)
      if (!passwordSet) {
        console.error('Failed to set MongoDB admin password')
        return false
      }

      // Save password
      fs.writeFileSync(MONGO_PASS_FILE, newPassword, 'utf-8')
      console.log('MongoDB admin password set and saved')

      // Re-enable security
      console.log('Re-enabling MongoDB security...')
      const enabled = await enableMongoSecurity(sudoPassword)
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
      const newPassword = await askPassword('Enter MongoDB admin password to set: ')
      
      // Create admin user
      const passwordSet = setMongoAdminPassword(newPassword)
      if (!passwordSet) {
        console.error('Failed to create MongoDB admin user')
        return false
      }

      // Save password
      fs.writeFileSync(MONGO_PASS_FILE, newPassword, 'utf-8')
      console.log('MongoDB admin user created and password saved')

      // Enable security
      console.log('Enabling MongoDB security...')
      const enabled = await enableMongoSecurity(sudoPassword)
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

async function main() {
  console.log('=== Webhook Deployer Initialization ===\n')

  const password = await askPassword()
  rl.close()

  // Validate sudo password
  console.log('Validating sudo access...')
  const validSudo = await validateSudo(password)
  if (!validSudo) {
    console.error('Invalid sudo password')
    process.exit(1)
  }
  console.log('Sudo access validated\n')

  // Setup sudoers
  const sudoersOk = await setupSudoers(password)
  if (!sudoersOk) {
    process.exit(1)
  }

  // Setup MongoDB authentication
  const mongoOk = await setupMongoAuth(password)
  if (!mongoOk) {
    process.exit(1)
  }

  console.log('\n=== Initialization complete ===')
}

main().catch((error) => {
  console.error('Initialization failed:', error.message)
  process.exit(1)
})
