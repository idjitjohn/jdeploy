const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { executeSudo } = require('../utils/sudo')
const { Configuration } = require('../models')

const getNginxPaths = async () => {
  const pathsConfig = await Configuration.findOne({ key: 'paths' })

  if (!pathsConfig) {
    throw new Error('Paths configuration not found')
  }

  return pathsConfig.value
}

const getNginxFilename = (repoName) => {
  return `${repoName}.conf`
}

const nginxExists = async (repoName) => {
  const paths = await getNginxPaths()
  const filename = getNginxFilename(repoName)
  const enabledPath = path.join(paths.nginxEnabled, filename)

  return fs.existsSync(enabledPath)
}

const generateNginxConfig = (repoConfig, nginxTemplate, paths) => {
  const variables = {
    '$name$': repoConfig.name,
    '$domain$': repoConfig.domain,
    '$port$': repoConfig.port,
    '$home$': paths.home
  }

  return nginxTemplate.map(line => {
    let result = line
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(key.replace('$', '\\$'), 'g'), value)
    })
    return result
  }).join('\n')
}

const writeNginxConfig = async (repoName, configContent) => {
  const paths = await getNginxPaths()
  const filename = getNginxFilename(repoName)
  const availablePath = path.join(paths.nginxAvailable, filename)

  if (!fs.existsSync(paths.nginxAvailable)) {
    fs.mkdirSync(paths.nginxAvailable, { recursive: true })
  }

  fs.writeFileSync(availablePath, configContent, 'utf-8')

  return availablePath
}

const enableNginx = async (repoName, sessionId = null) => {
  const paths = await getNginxPaths()
  const filename = getNginxFilename(repoName)
  const availablePath = path.join(paths.nginxAvailable, filename)
  const enabledPath = path.join(paths.nginxEnabled, filename)

  if (!fs.existsSync(availablePath)) {
    throw new Error(`Nginx config not found in available: ${availablePath}`)
  }

  if (fs.existsSync(enabledPath)) {
    return false
  }

  if (!fs.existsSync(paths.nginxEnabled)) {
    fs.mkdirSync(paths.nginxEnabled, { recursive: true })
  }

  try {
    fs.copyFileSync(availablePath, enabledPath)
    return true
  } catch (err) {
    if (err.code === 'EACCES' && sessionId) {
      await executeSudo(`cp ${availablePath} ${enabledPath}`, sessionId)
      return true
    }
    throw new Error(`Failed to enable nginx: ${err.message}`)
  }
}

const disableNginx = async (repoName, sessionId = null) => {
  const paths = await getNginxPaths()
  const filename = getNginxFilename(repoName)
  const enabledPath = path.join(paths.nginxEnabled, filename)

  if (!fs.existsSync(enabledPath)) {
    return false
  }

  try {
    fs.unlinkSync(enabledPath)
    return true
  } catch (err) {
    if (err.code === 'EACCES' && sessionId) {
      await executeSudo(`rm ${enabledPath}`, sessionId)
      return true
    }
    throw new Error(`Failed to disable nginx: ${err.message}`)
  }
}

const reloadNginx = async (sessionId = null) => {
  try {
    execSync('sudo nginx -s reload 2>/dev/null', { stdio: 'pipe' })
    return true
  } catch (err) {
    if (sessionId) {
      await executeSudo('nginx -s reload', sessionId)
      return true
    }
    throw new Error('Failed to reload nginx')
  }
}

const testNginxConfig = async (sessionId = null) => {
  try {
    execSync('sudo nginx -t 2>/dev/null', { stdio: 'pipe' })
    return { success: true }
  } catch (err) {
    if (sessionId) {
      try {
        await executeSudo('nginx -t', sessionId)
        return { success: true }
      } catch (testErr) {
        return { success: false, error: testErr.message }
      }
    }
    return { success: false, error: err.message }
  }
}

module.exports = {
  getNginxPaths,
  nginxExists,
  generateNginxConfig,
  writeNginxConfig,
  enableNginx,
  disableNginx,
  reloadNginx,
  testNginxConfig
}
