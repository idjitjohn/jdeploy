#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const readline = require('readline')

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

function askPassword() {
  return new Promise((resolve) => {
    const stdin = process.stdin
    const stdout = process.stdout

    stdout.write('Enter sudo password: ')
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')

    let password = ''
    stdin.on('data', (ch) => {
      if (ch === '\n' || ch === '\r') {
        stdin.setRawMode(false)
        stdin.pause()
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
    })
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

async function setupMongoAuth(password) {
  const mongodConf = '/etc/mongod.conf'

  console.log('\nConfiguring MongoDB authentication...')

  try {
    // Check if mongod.conf exists
    try {
      await execSudo(`test -f ${mongodConf}`, password)
    } catch {
      console.log('MongoDB config not found, skipping...')
      return true
    }

    // Check if security authorization is already enabled
    const content = await execSudo(`cat ${mongodConf}`, password)

    if (content.includes('authorization: enabled') || content.includes('authorization:enabled')) {
      console.log('MongoDB authorization already enabled, skipping...')
      return true
    }

    // Check if security section exists
    if (content.includes('security:')) {
      // Add authorization under existing security section
      await execSudo(`sed -i '/^security:/a\\  authorization: enabled' ${mongodConf}`, password)
    } else {
      // Add security section at the end
      await execSudo(`echo -e '\\nsecurity:\\n  authorization: enabled' >> ${mongodConf}`, password)
    }

    console.log('MongoDB authorization enabled')
    console.log('Restarting MongoDB...')

    try {
      await execSudo('systemctl restart mongod', password)
      console.log('MongoDB restarted successfully')
    } catch {
      console.log('Could not restart MongoDB automatically. Please restart manually.')
    }

    return true
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
