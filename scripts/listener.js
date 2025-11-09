#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const configPath = path.join(__dirname, '..', 'deploy.config.json')
let config = {}

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
} catch (err) {
  console.error('❌ Failed to read config: ensure deploy.config.json exists')
  process.exit(1)
}

const command = process.argv[2]
const args = process.argv.slice(3)

const SELF_PM2_NAME = 'webhook-deployer'

const getListenerName = (repoName, branchConfig, branchName) => {
  return branchConfig.pm2Name || `${repoName}-${branchName}`
}

const isSelfCommand = (nameArg) => {
  return nameArg && nameArg.toLowerCase() === 'self'
}

const getPM2Status = (pm2Name) => {
  try {
    const pm2List = execSync('pm2 list 2>/dev/null', { encoding: 'utf-8' })
    const lines = pm2List.split('\n')
    for (const line of lines) {
      if (line.includes(pm2Name)) {
        if (line.includes('online') || line.includes('running')) {
          return 'online'
        } else if (line.includes('stopped') || line.includes('stop')) {
          return 'stopped'
        }
      }
    }
  } catch (err) {
  }
  return 'stopped'
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'online':
      return '●'
    case 'stopped':
      return '○'
    default:
      return '?'
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'online':
      return '\x1b[32m' // green
    case 'stopped':
      return '\x1b[31m' // red
    default:
      return '\x1b[33m' // yellow
  }
}

const resetColor = '\x1b[0m'

const getNginxFilename = (repoName) => {
  return `${repoName}.conf`
}

const getNginxAvailablePath = (filename) => {
  return path.join(config.paths.nginxAvailable, filename)
}

const getNginxEnabledPath = (filename) => {
  return path.join(config.paths.nginxEnabled, filename)
}

const nginxExists = (repoName) => {
  const filename = getNginxFilename(repoName)
  return fs.existsSync(getNginxEnabledPath(filename))
}

const nginxEnable = (repoName) => {
  const filename = getNginxFilename(repoName)
  const availablePath = getNginxAvailablePath(filename)
  const enabledPath = getNginxEnabledPath(filename)

  if (!fs.existsSync(availablePath)) {
    throw new Error(`Nginx config not found in available: ${availablePath}`)
  }

  if (!fs.existsSync(enabledPath)) {
    try {
      fs.copyFileSync(availablePath, enabledPath)
      return true
    } catch (err) {
      if (err.code === 'EACCES') {
        console.log('🔐 Nginx requires elevated privileges. Prompting for password...')
        try {
          execSync(`sudo -p "Enter password: " cp ${availablePath} ${enabledPath}`, { stdio: 'inherit' })
          return true
        } catch (sudoErr) {
          throw new Error(`Permission denied or password incorrect`)
        }
      }
      throw new Error(`Failed to enable nginx for ${repoName}: ${err.message}`)
    }
  }

  return false
}

const nginxDisable = (repoName) => {
  const filename = getNginxFilename(repoName)
  const enabledPath = getNginxEnabledPath(filename)

  if (fs.existsSync(enabledPath)) {
    try {
      fs.unlinkSync(enabledPath)
      return true
    } catch (err) {
      if (err.code === 'EACCES') {
        console.log('🔐 Nginx requires elevated privileges. Prompting for password...')
        try {
          execSync(`sudo -p "Enter password: " rm ${enabledPath}`, { stdio: 'inherit' })
          return true
        } catch (sudoErr) {
          throw new Error(`Permission denied or password incorrect`)
        }
      }
      throw new Error(`Failed to disable nginx for ${repoName}: ${err.message}`)
    }
  }

  return false
}

const reloadNginx = () => {
  try {
    execSync('sudo nginx -s reload 2>/dev/null', { stdio: 'pipe' })
    return true
  } catch (err) {
    try {
      execSync('sudo nginx -s reload', { stdio: 'inherit' })
      return true
    } catch (sudoErr) {
      console.warn('⚠️  Warning: Could not reload nginx')
      return false
    }
  }
}

const triggerDeployment = (repoName, branch) => {
  const deployScript = path.join(__dirname, 'deploy.js')
  console.log(`\n📦 Triggering deployment for ${repoName}:${branch}...`)

  try {
    execSync(`node ${deployScript} ${repoName} ${branch}`, {
      stdio: 'inherit'
    })
    console.log(`✓ Deployment completed`)
    return true
  } catch (err) {
    console.error(`❌ Deployment failed: ${err.message}`)
    return false
  }
}

const list = () => {
  const listeners = []
  config.repositories.forEach(repo => {
    Object.entries(repo.branches || {}).forEach(([branch, branchConfig]) => {
      const listenerName = getListenerName(repo.name, branchConfig, branch)
      const status = getPM2Status(listenerName)
      listeners.push({
        name: repo.name,
        branch,
        type: branchConfig.type,
        pm2Name: listenerName,
        status,
        port: repo.port || 'N/A'
      })
    })
  })

  if (listeners.length === 0) {
    console.log('\n📋 No listeners configured\n')
    return
  }

  console.log('\n')
  console.log('  id │ name                     │ branch   │ type   │ port   │ status')
  console.log('  ───┼──────────────────────────┼──────────┼────────┼────────┼─────────')

  listeners.forEach((listener, idx) => {
    const statusColor = getStatusColor(listener.status)
    const statusIcon = getStatusIcon(listener.status)
    const id = String(idx).padEnd(2)
    const nameDisplay = (listener.name + ':' + listener.branch).padEnd(24)
    const branchDisplay = listener.branch.padEnd(8)
    const typeDisplay = listener.type.padEnd(6)
    const portDisplay = String(listener.port).padEnd(6)
    const statusDisplay = `${statusColor}${statusIcon} ${listener.status}${resetColor}`

    console.log(`  ${id} │ ${nameDisplay} │ ${branchDisplay} │ ${typeDisplay} │ ${portDisplay} │ ${statusDisplay}`)
  })

  console.log('\n')
  console.log('  Use "yarn listener help" for more commands')
  console.log('')
}

const start = (nameArg) => {
  if (!nameArg) {
    console.error('❌ Please specify a listener name or name:type')
    console.error('   Usage: yarn listener start <name> [or <name:type>]')
    process.exit(1)
  }

  if (isSelfCommand(nameArg)) {
    try {
      console.log(`Starting ${SELF_PM2_NAME}...`)
      execSync(`pm2 start ${SELF_PM2_NAME}`, { stdio: 'inherit' })
    } catch (err) {
      console.error(`❌ Failed to start ${SELF_PM2_NAME}`)
    }
    return
  }

  const [repoName, typeArg] = nameArg.split(':')
  const repo = config.repositories.find(r => r.name === repoName)

  if (!repo) {
    console.error(`❌ Repository "${repoName}" not found`)
    process.exit(1)
  }

  const branchEntries = Object.entries(repo.branches || {})

  if (branchEntries.length === 0) {
    console.error(`❌ No branches configured for "${repoName}"`)
    process.exit(1)
  }

  const targetBranches = typeArg
    ? branchEntries.filter(([_, config]) => config.type === typeArg)
    : branchEntries

  if (typeArg && targetBranches.length === 0) {
    console.error(`❌ No branches found with type "${typeArg}" for "${repoName}"`)
    process.exit(1)
  }

  targetBranches.forEach(([branch, branchConfig]) => {
    const listenerName = getListenerName(repoName, branchConfig, branch)
    try {
      console.log(`Starting ${listenerName}...`)

      try {
        const nginxEnabled = nginxEnable(repoName)
        if (nginxEnabled) {
          console.log(`  ✓ Nginx enabled for ${repoName}`)
          reloadNginx()
        } else {
          console.log(`  ℹ Nginx already enabled for ${repoName}`)
        }
      } catch (nginxErr) {
        console.warn(`  ⚠️  ${nginxErr.message}`)
      }

      triggerDeployment(repoName, branch)
    } catch (err) {
      console.error(`❌ Failed to start ${listenerName}`)
    }
  })
}

const stop = (nameArg) => {
  if (!nameArg) {
    console.error('❌ Please specify a listener name or name:type')
    console.error('   Usage: yarn listener stop <name> [or <name:type>]')
    process.exit(1)
  }

  if (isSelfCommand(nameArg)) {
    try {
      console.log(`Stopping ${SELF_PM2_NAME}...`)
      execSync(`pm2 stop ${SELF_PM2_NAME}`, { stdio: 'inherit' })
    } catch (err) {
      console.error(`⚠️  ${SELF_PM2_NAME} may not be running`)
    }
    return
  }

  const [repoName, typeArg] = nameArg.split(':')
  const repo = config.repositories.find(r => r.name === repoName)

  if (!repo) {
    console.error(`❌ Repository "${repoName}" not found`)
    process.exit(1)
  }

  const branchEntries = Object.entries(repo.branches || {})

  if (branchEntries.length === 0) {
    console.error(`❌ No branches configured for "${repoName}"`)
    process.exit(1)
  }

  const targetBranches = typeArg
    ? branchEntries.filter(([_, config]) => config.type === typeArg)
    : branchEntries

  if (typeArg && targetBranches.length === 0) {
    console.error(`❌ No branches found with type "${typeArg}" for "${repoName}"`)
    process.exit(1)
  }

  targetBranches.forEach(([branch, branchConfig]) => {
    const listenerName = getListenerName(repoName, branchConfig, branch)
    try {
      console.log(`Stopping ${listenerName}...`)

      try {
        const nginxDisabled = nginxDisable(repoName)
        if (nginxDisabled) {
          console.log(`  ✓ Nginx disabled for ${repoName}`)
          reloadNginx()
        } else {
          console.log(`  ℹ Nginx already disabled for ${repoName}`)
        }
      } catch (nginxErr) {
        console.warn(`  ⚠️  ${nginxErr.message}`)
      }

      execSync(`pm2 stop ${listenerName}`, { stdio: 'inherit' })
      console.log(`  ✓ PM2 process stopped`)
    } catch (err) {
      console.error(`⚠️  ${listenerName} may not be running`)
    }
  })
}

const restart = (nameArg) => {
  if (!nameArg) {
    console.error('❌ Please specify a listener name or name:type')
    console.error('   Usage: yarn listener restart <name> [or <name:type>]')
    process.exit(1)
  }

  if (isSelfCommand(nameArg)) {
    try {
      console.log(`Restarting ${SELF_PM2_NAME}...`)
      execSync(`pm2 restart ${SELF_PM2_NAME}`, { stdio: 'inherit' })
    } catch (err) {
      console.error(`❌ Failed to restart ${SELF_PM2_NAME}`)
    }
    return
  }

  const [repoName, typeArg] = nameArg.split(':')
  const repo = config.repositories.find(r => r.name === repoName)

  if (!repo) {
    console.error(`❌ Repository "${repoName}" not found`)
    process.exit(1)
  }

  const branchEntries = Object.entries(repo.branches || {})

  if (branchEntries.length === 0) {
    console.error(`❌ No branches configured for "${repoName}"`)
    process.exit(1)
  }

  const targetBranches = typeArg
    ? branchEntries.filter(([_, config]) => config.type === typeArg)
    : branchEntries

  if (typeArg && targetBranches.length === 0) {
    console.error(`❌ No branches found with type "${typeArg}" for "${repoName}"`)
    process.exit(1)
  }

  targetBranches.forEach(([branch, branchConfig]) => {
    const listenerName = getListenerName(repoName, branchConfig, branch)
    try {
      console.log(`Restarting ${listenerName}...`)

      try {
        const nginxEnabled = nginxEnable(repoName)
        if (nginxEnabled) {
          console.log(`  ✓ Nginx enabled for ${repoName}`)
        } else {
          console.log(`  ℹ Nginx already enabled for ${repoName}`)
        }
        reloadNginx()
      } catch (nginxErr) {
        console.warn(`  ⚠️  ${nginxErr.message}`)
      }

      triggerDeployment(repoName, branch)

      execSync(`pm2 restart ${listenerName}`, { stdio: 'inherit' })
      console.log(`  ✓ PM2 process restarted`)
    } catch (err) {
      console.error(`❌ Failed to restart ${listenerName}`)
    }
  })
}

const reload = (nameArg) => {
  if (!nameArg) {
    console.error('❌ Please specify a listener name or name:type')
    console.error('   Usage: yarn listener reload <name> [or <name:type>]')
    process.exit(1)
  }

  if (isSelfCommand(nameArg)) {
    try {
      console.log(`Gracefully reloading ${SELF_PM2_NAME}...`)
      execSync(`pm2 reload ${SELF_PM2_NAME}`, { stdio: 'inherit' })
    } catch (err) {
      console.error(`❌ Failed to reload ${SELF_PM2_NAME}`)
    }
    return
  }

  const [repoName, typeArg] = nameArg.split(':')
  const repo = config.repositories.find(r => r.name === repoName)

  if (!repo) {
    console.error(`❌ Repository "${repoName}" not found`)
    process.exit(1)
  }

  const branchEntries = Object.entries(repo.branches || {})

  if (branchEntries.length === 0) {
    console.error(`❌ No branches configured for "${repoName}"`)
    process.exit(1)
  }

  const targetBranches = typeArg
    ? branchEntries.filter(([_, config]) => config.type === typeArg)
    : branchEntries

  if (typeArg && targetBranches.length === 0) {
    console.error(`❌ No branches found with type "${typeArg}" for "${repoName}"`)
    process.exit(1)
  }

  targetBranches.forEach(([branch, branchConfig]) => {
    const listenerName = getListenerName(repoName, branchConfig, branch)
    try {
      console.log(`Gracefully reloading ${listenerName}...`)

      try {
        const nginxEnabled = nginxEnable(repoName)
        if (nginxEnabled) {
          console.log(`  ✓ Nginx enabled for ${repoName}`)
        } else {
          console.log(`  ℹ Nginx already enabled for ${repoName}`)
        }
        reloadNginx()
      } catch (nginxErr) {
        console.warn(`  ⚠️  ${nginxErr.message}`)
      }

      triggerDeployment(repoName, branch)

      execSync(`pm2 reload ${listenerName}`, { stdio: 'inherit' })
      console.log(`  ✓ PM2 process gracefully reloaded`)
    } catch (err) {
      console.error(`❌ Failed to reload ${listenerName}`)
    }
  })
}

const deleteListener = (nameArg) => {
  if (!nameArg) {
    console.error('❌ Please specify a listener name or name:type')
    console.error('   Usage: yarn listener delete <name> [or <name:type>]')
    process.exit(1)
  }

  if (isSelfCommand(nameArg)) {
    try {
      console.log(`Deleting ${SELF_PM2_NAME}...`)
      execSync(`pm2 delete ${SELF_PM2_NAME}`, { stdio: 'inherit' })
    } catch (err) {
      console.error(`⚠️  ${SELF_PM2_NAME} may not exist`)
    }
    return
  }

  const [repoName, typeArg] = nameArg.split(':')
  const repo = config.repositories.find(r => r.name === repoName)

  if (!repo) {
    console.error(`❌ Repository "${repoName}" not found`)
    process.exit(1)
  }

  const branchEntries = Object.entries(repo.branches || {})

  if (branchEntries.length === 0) {
    console.error(`❌ No branches configured for "${repoName}"`)
    process.exit(1)
  }

  const targetBranches = typeArg
    ? branchEntries.filter(([_, config]) => config.type === typeArg)
    : branchEntries

  if (typeArg && targetBranches.length === 0) {
    console.error(`❌ No branches found with type "${typeArg}" for "${repoName}"`)
    process.exit(1)
  }

  targetBranches.forEach(([branch, branchConfig]) => {
    const listenerName = getListenerName(repoName, branchConfig, branch)
    try {
      console.log(`Deleting ${listenerName}...`)

      try {
        const nginxDisabled = nginxDisable(repoName)
        if (nginxDisabled) {
          console.log(`  ✓ Nginx disabled for ${repoName}`)
          reloadNginx()
        } else {
          console.log(`  ℹ Nginx already disabled for ${repoName}`)
        }
      } catch (nginxErr) {
        console.warn(`  ⚠️  ${nginxErr.message}`)
      }

      execSync(`pm2 delete ${listenerName}`, { stdio: 'inherit' })
      console.log(`  ✓ PM2 process deleted`)
      console.log(`  ℹ Configuration preserved in deploy.config.json`)
    } catch (err) {
      console.error(`⚠️  ${listenerName} may not exist`)
    }
  })
}

const logs = (nameArg, options = {}) => {
  if (!nameArg) {
    console.error('❌ Please specify a listener name or name:type')
    console.error('   Usage: yarn listener logs <name> [or <name:type>]')
    process.exit(1)
  }

  if (isSelfCommand(nameArg)) {
    try {
      console.log(`Showing logs for ${SELF_PM2_NAME}...\n`)
      execSync(`pm2 logs ${SELF_PM2_NAME}`, { stdio: 'inherit' })
    } catch (err) {
      console.error(`❌ Failed to show logs for ${SELF_PM2_NAME}`)
    }
    return
  }

  const [repoName, typeArg] = nameArg.split(':')
  const repo = config.repositories.find(r => r.name === repoName)

  if (!repo) {
    console.error(`❌ Repository "${repoName}" not found`)
    process.exit(1)
  }

  const branchEntries = Object.entries(repo.branches || {})

  if (branchEntries.length === 0) {
    console.error(`❌ No branches configured for "${repoName}"`)
    process.exit(1)
  }

  const targetBranches = typeArg
    ? branchEntries.filter(([_, config]) => config.type === typeArg)
    : branchEntries

  if (typeArg && targetBranches.length === 0) {
    console.error(`❌ No branches found with type "${typeArg}" for "${repoName}"`)
    process.exit(1)
  }

  if (targetBranches.length > 1) {
    console.error(`⚠️  Multiple listeners found. Please specify name:type`)
    process.exit(1)
  }

  const [branch, branchConfig] = targetBranches[0]
  const listenerName = getListenerName(repoName, branchConfig, branch)

  try {
    console.log(`Showing logs for ${listenerName}...\n`)
    execSync(`pm2 logs ${listenerName}`, { stdio: 'inherit' })
  } catch (err) {
    console.error(`❌ Failed to show logs for ${listenerName}`)
  }
}

const describe = (nameArg) => {
  if (!nameArg) {
    console.error('❌ Please specify a listener name or name:type')
    console.error('   Usage: yarn listener describe <name> [or <name:type>]')
    process.exit(1)
  }

  if (isSelfCommand(nameArg)) {
    const status = getPM2Status(SELF_PM2_NAME)

    console.log('\n')
    console.log('  ┌────────────────────────────────────────┐')
    console.log(`  │ ${SELF_PM2_NAME.padEnd(38)} │`)
    console.log('  └────────────────────────────────────────┘')
    console.log('')
    console.log(`  Name:        ${SELF_PM2_NAME}`)
    console.log(`  Status:      ${status}`)
    console.log(`  Domain:      ${config.self.domain}`)
    console.log(`  Subdomain:   ${config.self.subdomain}`)
    console.log(`  Port:        ${config.self.port}`)
    console.log(`  Description: Webhook listener for automated deployments`)
    console.log('')
    console.log('  Managed Repositories:')
    config.repositories.forEach((repo) => {
      Object.entries(repo.branches || {}).forEach(([branch, branchConfig]) => {
        console.log(`    • ${repo.name}:${branch} (${branchConfig.type})`)
      })
    })
    console.log('')
    console.log('')
    return
  }

  const [repoName, typeArg] = nameArg.split(':')
  const repo = config.repositories.find(r => r.name === repoName)

  if (!repo) {
    console.error(`❌ Repository "${repoName}" not found`)
    process.exit(1)
  }

  const branchEntries = Object.entries(repo.branches || {})

  if (branchEntries.length === 0) {
    console.error(`❌ No branches configured for "${repoName}"`)
    process.exit(1)
  }

  const targetBranches = typeArg
    ? branchEntries.filter(([_, config]) => config.type === typeArg)
    : branchEntries

  if (typeArg && targetBranches.length === 0) {
    console.error(`❌ No branches found with type "${typeArg}" for "${repoName}"`)
    process.exit(1)
  }

  targetBranches.forEach(([branch, branchConfig]) => {
    const listenerName = getListenerName(repoName, branchConfig, branch)
    const status = getPM2Status(listenerName)

    console.log('\n')
    console.log('  ┌────────────────────────────────────────┐')
    console.log(`  │ ${listenerName.padEnd(38)} │`)
    console.log('  └────────────────────────────────────────┘')
    console.log('')
    console.log(`  Repository:  ${repo.name}`)
    console.log(`  Branch:      ${branch}`)
    console.log(`  Type:        ${branchConfig.type}`)
    console.log(`  PM2 Name:    ${listenerName}`)
    console.log(`  Status:      ${status}`)
    console.log(`  Domain:      ${repo.domain || 'N/A'}`)
    console.log(`  Port:        ${repo.port || 'N/A'}`)
    console.log(`  Template:    ${repo.template || 'N/A'}`)
    console.log('')

    if (repo.commands && repo.commands.length > 0) {
      console.log('  Deploy Commands:')
      repo.commands.forEach((cmd, idx) => {
        console.log(`    ${idx + 1}. ${cmd}`)
      })
      console.log('')
    }

    if (repo.env && Object.keys(repo.env).length > 0) {
      console.log('  Environment Variables:')
      Object.entries(repo.env).forEach(([key, value]) => {
        console.log(`    ${key}=${value}`)
      })
      console.log('')
    }

    console.log('')
  })
}

const rename = (nameArg, newName) => {
  if (!nameArg || !newName) {
    console.error('❌ Please specify both old and new names')
    console.error('   Usage: yarn listener rename <oldName>[:<type>] <newName>')
    process.exit(1)
  }

  const [repoName, typeArg] = nameArg.split(':')
  const repo = config.repositories.find(r => r.name === repoName)

  if (!repo) {
    console.error(`❌ Repository "${repoName}" not found`)
    process.exit(1)
  }

  const branchEntries = Object.entries(repo.branches || {})

  if (branchEntries.length === 0) {
    console.error(`❌ No branches configured for "${repoName}"`)
    process.exit(1)
  }

  const targetBranches = typeArg
    ? branchEntries.filter(([_, config]) => config.type === typeArg)
    : branchEntries

  if (typeArg && targetBranches.length === 0) {
    console.error(`❌ No branches found with type "${typeArg}" for "${repoName}"`)
    process.exit(1)
  }

  targetBranches.forEach(([branch, branchConfig]) => {
    const oldName = getListenerName(repoName, branchConfig, branch)
    try {
      console.log(`Renaming ${oldName} to ${newName}...`)

      try {
        const oldNginxFilename = getNginxFilename(repoName)
        const newNginxFilename = getNginxFilename(newName)
        const oldEnabledPath = getNginxEnabledPath(oldNginxFilename)
        const newEnabledPath = getNginxEnabledPath(newNginxFilename)
        const newAvailablePath = getNginxAvailablePath(newNginxFilename)

        if (fs.existsSync(oldEnabledPath)) {
          fs.renameSync(oldEnabledPath, newEnabledPath)
          console.log(`  ✓ Nginx config renamed`)
        }

        const oldAvailablePath = getNginxAvailablePath(oldNginxFilename)
        if (fs.existsSync(oldAvailablePath) && !fs.existsSync(newAvailablePath)) {
          fs.renameSync(oldAvailablePath, newAvailablePath)
        }

        reloadNginx()
      } catch (nginxErr) {
        console.warn(`  ⚠️  ${nginxErr.message}`)
      }

      try {
        repo.name = newName
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
        console.log(`  ✓ Configuration updated in deploy.config.json`)
      } catch (configErr) {
        console.warn(`  ⚠️  Failed to update config: ${configErr.message}`)
      }

      execSync(`pm2 rename ${oldName} ${newName}`, { stdio: 'inherit' })
      console.log(`  ✓ PM2 process renamed`)
    } catch (err) {
      console.error(`❌ Failed to rename ${oldName}`)
    }
  })
}

const help = () => {
  console.log('\n🎧 Listener Management CLI')
  console.log('━'.repeat(70))
  console.log('\nUsage:')
  console.log('  yarn listener list                    List all listeners')
  console.log('  yarn listener start <name>[:<type>]   Enable nginx + start PM2')
  console.log('  yarn listener stop <name>[:<type>]    Disable nginx + stop PM2')
  console.log('  yarn listener restart <name>[:<type>] Verify nginx + restart PM2')
  console.log('  yarn listener reload <name>[:<type>]  Verify nginx + reload PM2')
  console.log('  yarn listener delete <name>[:<type>]  Disable nginx + delete PM2')
  console.log('  yarn listener logs <name>[:<type>]    View PM2 logs (tail)')
  console.log('  yarn listener describe <name>[:<type>] Show full config')
  console.log('  yarn listener rename <name> <newName> Rename everywhere')
  console.log('\nWorkflow:')
  console.log('  1. start - Copies nginx from available → enabled, starts PM2')
  console.log('  2. stop  - Deletes nginx from enabled, stops PM2')
  console.log('  3. restart/reload - Ensures nginx exists, restarts PM2')
  console.log('  4. delete - Cleans up nginx & PM2, keeps config')
  console.log('  5. rename - Updates repository name, nginx files & PM2')
  console.log('\nSpecial Commands:')
  console.log('  Use "self" to manage webhook listener itself')
  console.log('  Example: yarn listener restart self')
  console.log('\nExamples:')
  console.log('  yarn listener list')
  console.log('  yarn listener start izolearn-back')
  console.log('  yarn listener restart izolearn-back:prod')
  console.log('  yarn listener stop izolearn-back:prod')
  console.log('  yarn listener describe izolearn-back')
  console.log('\n' + '━'.repeat(70) + '\n')
}

switch (command) {
  case 'list':
    list()
    break
  case 'start':
    start(args[0])
    break
  case 'stop':
    stop(args[0])
    break
  case 'restart':
    restart(args[0])
    break
  case 'reload':
    reload(args[0])
    break
  case 'delete':
    deleteListener(args[0])
    break
  case 'logs':
    logs(args[0])
    break
  case 'describe':
    describe(args[0])
    break
  case 'rename':
    rename(args[0], args[1])
    break
  case 'help':
  case '-h':
  case '--help':
    help()
    break
  default:
    if (!command) {
      console.error('❌ No command specified')
    } else {
      console.error(`❌ Unknown command: ${command}`)
    }
    help()
    process.exit(1)
}
