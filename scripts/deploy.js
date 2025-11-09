#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const repoName = process.argv[2]
const branch = process.argv[3]

if (!repoName || !branch) {
  console.error('Usage: deploy.js <repo-name> <branch>')
  process.exit(1)
}

const configPath = path.join(__dirname, '..', 'deploy.config.json')
const logDir = path.join(process.env.HOME || '/tmp', 'deploy-logs')

const timestamp = () => new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
const log = (msg) => console.log(`[${timestamp()}] ${msg}`)
const error = (msg) => console.error(`[${timestamp()}] ERROR: ${msg}`)

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

log(`=== Starting deployment for ${repoName}:${branch} ===`)

if (!fs.existsSync(configPath)) {
  error(`Config file not found: ${configPath}`)
  process.exit(1)
}

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

  const repoConfig = config.repositories.find(r => r.name === repoName)
  if (!repoConfig) {
    error(`Repository "${repoName}" not found`)
    process.exit(1)
  }

  const branchConfig = repoConfig.branches[branch]
  if (!branchConfig) {
    error(`Branch "${branch}" not found in repository "${repoName}"`)
    process.exit(1)
  }

  const codeFolder = path.join(config.paths.home, 'code', repoName)
  const branchType = branchConfig.type || 'dev'
  const releaseFolder = path.join(config.paths.home, 'release', repoName, branchType)
  const pm2Name = branchConfig.pm2Name || ''
  const template = repoConfig.template || 'node'

  log(`Code folder: ${codeFolder}`)
  log(`Release folder: ${releaseFolder}`)
  log(`Branch type: ${branchType}`)
  log(`PM2 name: ${pm2Name}`)
  log(`Template: ${template}`)

  if (!fs.existsSync(codeFolder)) {
    log(`Creating code directory: ${codeFolder}`)
    fs.mkdirSync(codeFolder, { recursive: true })
  }

  if (!fs.existsSync(releaseFolder)) {
    log(`Creating release directory: ${releaseFolder}`)
    fs.mkdirSync(releaseFolder, { recursive: true })
  }


  const runCommandList = (commands, phase) => {
    if (!commands || commands.length === 0) {
      return
    }

    log(`${phase}...`)

    commands.forEach((cmd) => {
      let interpolated = cmd
      interpolated = interpolated.replace(/\$cf\$/g, codeFolder)
      interpolated = interpolated.replace(/\$rf\$/g, releaseFolder)
      interpolated = interpolated.replace(/\$branch\$/g, branch)
      interpolated = interpolated.replace(/\$pm2Name\$/g, pm2Name)
      interpolated = interpolated.replace(/\$port\$/g, repoConfig.port || '')

      log(`Running: ${interpolated}`)

      try {
        execSync(interpolated, {
          cwd: codeFolder,
          stdio: 'inherit',
          shell: '/bin/bash'
        })
      } catch (err) {
        error(`Command failed: ${interpolated}`)
        process.exit(1)
      }
    })
  }

  const beforeCommands = [
    ...(repoConfig.preDeploy || []),
    ...(branchConfig.preDeploy || [])
  ]

  const mainCommands = repoConfig.commands || []

  const afterCommands = [
    ...(repoConfig.postDeploy || []),
    ...(branchConfig.postDeploy || [])
  ]

  runCommandList(beforeCommands, 'Before-deploy')
  runCommandList(mainCommands, 'Deployment')
  runCommandList(afterCommands, 'After-deploy')

  log('=== Deployment completed successfully ===')
} catch (err) {
  error(err.message)
  process.exit(1)
}
