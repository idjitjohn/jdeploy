const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { Repository, Configuration, DeploymentLog } = require('../models')
const { interpolateVariables, getDeploymentVariables } = require('../utils/interpolation')

const executeDeployment = async (repoName, branch, triggeredBy = 'system', webhookPayload = null) => {
  const deploymentLog = await DeploymentLog.create({
    repository: repoName,
    branch,
    type: webhookPayload ? 'webhook' : 'manual',
    status: 'pending',
    triggeredBy,
    webhookPayload
  })

  try {
    const repo = await Repository.findOne({ name: repoName })
    if (!repo) {
      throw new Error(`Repository "${repoName}" not found`)
    }

    const branchConfig = repo.branches.get(branch)
    if (!branchConfig) {
      throw new Error(`Branch "${branch}" not found in repository "${repoName}"`)
    }

    const pathsConfig = await Configuration.findOne({ key: 'paths' })
    if (!pathsConfig) {
      throw new Error('Paths configuration not found')
    }

    const paths = pathsConfig.value
    const variables = getDeploymentVariables(repo, branch, branchConfig, paths)

    const codeFolder = variables.cf
    const releaseFolder = variables.rf

    if (!fs.existsSync(codeFolder)) {
      fs.mkdirSync(codeFolder, { recursive: true })
    }

    if (!fs.existsSync(releaseFolder)) {
      fs.mkdirSync(releaseFolder, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_')
    const logDir = path.join(process.env.HOME || '/tmp', 'deploy-logs')

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    const logFile = path.join(logDir, `${repoName}-${branch}-${timestamp}.log`)
    const logStream = fs.createWriteStream(logFile, { flags: 'a' })

    const log = (msg) => {
      const timestampStr = new Date().toISOString()
      const logLine = `[${timestampStr}] ${msg}\n`
      logStream.write(logLine)
      console.log(msg)
    }

    deploymentLog.status = 'running'
    deploymentLog.logFile = logFile
    await deploymentLog.save()

    log(`=== Starting deployment for ${repoName}:${branch} ===`)
    log(`Code folder: ${codeFolder}`)
    log(`Release folder: ${releaseFolder}`)
    log(`Branch type: ${branchConfig.type}`)
    log(`PM2 name: ${branchConfig.pm2Name}`)

    const runCommandList = (commands, phase) => {
      if (!commands || commands.length === 0) {
        return
      }

      log(`\n${phase}...`)

      commands.forEach((cmd) => {
        const interpolated = interpolateVariables(cmd, variables)
        log(`Running: ${interpolated}`)

        try {
          execSync(interpolated, {
            cwd: codeFolder,
            stdio: 'inherit',
            shell: '/bin/bash'
          })
        } catch (err) {
          throw new Error(`Command failed: ${interpolated}`)
        }
      })
    }

    const beforeCommands = [
      ...(repo.preDeploy || []),
      ...(branchConfig.preDeploy || [])
    ]

    const mainCommands = repo.commands || []

    const afterCommands = [
      ...(repo.postDeploy || []),
      ...(branchConfig.postDeploy || [])
    ]

    runCommandList(beforeCommands, 'Before-deploy')
    runCommandList(mainCommands, 'Deployment')
    runCommandList(afterCommands, 'After-deploy')

    log('\n=== Deployment completed successfully ===')
    logStream.end()

    deploymentLog.status = 'success'
    deploymentLog.completedAt = new Date()
    deploymentLog.exitCode = 0
    await deploymentLog.save()

    return deploymentLog._id
  } catch (error) {
    deploymentLog.status = 'failed'
    deploymentLog.completedAt = new Date()
    deploymentLog.errorMessage = error.message
    deploymentLog.exitCode = 1
    await deploymentLog.save()

    throw error
  }
}

const getDeploymentLogs = async (repoName, options = {}) => {
  const query = { repository: repoName }

  if (options.branch) {
    query.branch = options.branch
  }

  if (options.status) {
    query.status = options.status
  }

  const limit = options.limit || 50
  const offset = options.offset || 0

  const logs = await DeploymentLog.find(query)
    .sort({ startedAt: -1 })
    .skip(offset)
    .limit(limit)

  const total = await DeploymentLog.countDocuments(query)

  return { logs, total }
}

const getDeploymentLogById = async (logId) => {
  const log = await DeploymentLog.findById(logId)

  if (!log) {
    throw new Error('Deployment log not found')
  }

  let content = ''
  if (log.logFile && fs.existsSync(log.logFile)) {
    content = fs.readFileSync(log.logFile, 'utf-8')
  }

  return { log, content }
}

module.exports = {
  executeDeployment,
  getDeploymentLogs,
  getDeploymentLogById
}
