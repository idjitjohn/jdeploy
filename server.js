#!/usr/bin/env node

require('dotenv').config()

const fs = require('fs')
const path = require('path')

// Check if config is initialized
const configPath = path.join(__dirname, 'deploy.config.json')
if (!fs.existsSync(configPath)) {
  console.error('❌ Configuration not initialized')
  console.error('Please run: yarn self-deploy')
  process.exit(1)
}

let config
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
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

// Assign config values to process.env
process.env.WEBHOOK_PORT = process.env.WEBHOOK_PORT || config.self.port
process.env.WEBHOOK_BRANCH = process.env.WEBHOOK_BRANCH || 'main'
process.env.WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your_long_secret_here'

const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const { spawn } = require('child_process')

const app = express()
app.use(bodyParser.json())

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
const WEBHOOK_PORT = process.env.WEBHOOK_PORT
const WEBHOOK_BRANCH = process.env.WEBHOOK_BRANCH
const LOG_DIR = path.join(process.env.HOME || '/tmp', 'deploy-logs')

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

const log = (message) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`)
}

const verifyGitHubSignature = (req) => {
  const signature = req.headers['x-hub-signature-256']
  if (!signature) return false

  const body = JSON.stringify(req.body)
  const hash = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  )
}

const verifyGitLabToken = (req) => {
  const token = req.headers['x-gitlab-token']
  return token === WEBHOOK_SECRET
}

const verifyWebhook = (req) => {
  const isGitHub = req.headers['x-hub-signature-256']
  const isGitLab = req.headers['x-gitlab-token']

  if (isGitHub) {
    return verifyGitHubSignature(req)
  } else if (isGitLab) {
    return verifyGitLabToken(req)
  }

  return false
}

const executeDeployScript = (repo, branch) => {
  const deployScript = path.join(__dirname, 'scripts', 'deploy.js')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logFile = path.join(LOG_DIR, `${repo}-${branch}-${timestamp}.log`)

  const logStream = fs.createWriteStream(logFile, { flags: 'a' })

  log(`Triggering deployment for ${repo}:${branch}`)
  log(`Log file: ${logFile}`)

  const child = spawn('node', [deployScript, repo, branch], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  child.stdout.pipe(logStream)
  child.stderr.pipe(logStream)

  child.on('error', (err) => {
    log(`ERROR: Failed to spawn deploy script: ${err.message}`)
    logStream.write(`\nERROR: ${err.message}\n`)
    logStream.end()
  })

  child.on('exit', (code) => {
    logStream.write(`\nDeploy process exited with code ${code}\n`)
    logStream.end()
    if (code === 0) {
      log(`Deployment completed successfully for ${repo}:${branch}`)
    } else {
      log(`Deployment failed for ${repo}:${branch} (exit code: ${code})`)
    }
  })

  child.unref()
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/webhook', (req, res) => {
  log(`Webhook received from ${req.ip}`)

  if (!verifyWebhook(req)) {
    log('Webhook verification failed - unauthorized')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const ref = req.body.ref || req.body.object_kind
  if (!ref) {
    log('No ref found in webhook payload')
    return res.status(400).json({ error: 'No ref in payload' })
  }

  const branch = ref.replace(/^refs\/heads\//, '')
  const repoName = req.body.repository?.name ||
                   req.body.project?.name ||
                   req.body.project?.path_with_namespace?.split('/').pop() ||
                   'unknown'

  log(`Webhook for ${repoName}:${branch}`)

  if (WEBHOOK_BRANCH !== '*' && branch !== WEBHOOK_BRANCH) {
    log(`Branch ${branch} does not match configured branch ${WEBHOOK_BRANCH}. Ignoring.`)
    return res.status(200).json({ ignored: true, reason: 'branch not configured' })
  }

  res.status(200).json({ received: true, repo: repoName, branch: branch })

  setImmediate(() => {
    executeDeployScript(repoName, branch)
  })
})

app.listen(WEBHOOK_PORT, () => {
  log(`Webhook listener started on port ${WEBHOOK_PORT}`)
  log(`WEBHOOK_SECRET set: ${WEBHOOK_SECRET !== 'your_long_secret_here' ? 'yes' : 'NO - using default!'}`)
  log(`Configured branch: ${WEBHOOK_BRANCH}`)
})

process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully')
  process.exit(0)
})
