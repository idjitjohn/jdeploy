const { Repository } = require('../models')
const authMiddleware = require('../middleware/auth')
const { executeDeployment } = require('../services/deploymentService')
const { stopPM2, restartPM2, reloadPM2, deletePM2 } = require('../services/pm2Service')
const { enableNginx, disableNginx, reloadNginx } = require('../services/nginxService')

async function deploymentsRoutes(fastify, options) {
  fastify.post('/api/deployments/:repoName/start', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, type } = request.query

    const repo = await Repository.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    let targetBranch = branch

    if (!targetBranch && type) {
      for (const [branchName, branchConfig] of repo.branches) {
        if (branchConfig.type === type) {
          targetBranch = branchName
          break
        }
      }
    }

    if (!targetBranch) {
      targetBranch = repo.branches.keys().next().value
    }

    if (!repo.branches.has(targetBranch)) {
      return reply.code(400).send({ error: `Branch "${targetBranch}" not found in repository` })
    }

    const sessionId = request.cookies.sessionId

    try {
      await enableNginx(repoName, sessionId)
      await reloadNginx(sessionId)
    } catch (error) {
      console.warn('Nginx operations warning:', error.message)
    }

    const deploymentLogId = await executeDeployment(
      repoName,
      targetBranch,
      request.user.username
    )

    return {
      success: true,
      deploymentLogId,
      repository: repoName,
      branch: targetBranch
    }
  })

  fastify.post('/api/deployments/:repoName/stop', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, type } = request.query

    const repo = await Repository.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    let targetBranch = branch

    if (!targetBranch && type) {
      for (const [branchName, branchConfig] of repo.branches) {
        if (branchConfig.type === type) {
          targetBranch = branchName
          break
        }
      }
    }

    if (!targetBranch) {
      targetBranch = repo.branches.keys().next().value
    }

    const branchConfig = repo.branches.get(targetBranch)

    if (!branchConfig) {
      return reply.code(400).send({ error: `Branch "${targetBranch}" not found` })
    }

    const sessionId = request.cookies.sessionId

    try {
      await disableNginx(repoName, sessionId)
      await reloadNginx(sessionId)
    } catch (error) {
      console.warn('Nginx operations warning:', error.message)
    }

    try {
      await stopPM2(branchConfig.pm2Name)
    } catch (error) {
      console.warn('PM2 stop warning:', error.message)
    }

    return {
      success: true,
      repository: repoName,
      branch: targetBranch
    }
  })

  fastify.post('/api/deployments/:repoName/restart', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, type } = request.query

    const repo = await Repository.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    let targetBranch = branch

    if (!targetBranch && type) {
      for (const [branchName, branchConfig] of repo.branches) {
        if (branchConfig.type === type) {
          targetBranch = branchName
          break
        }
      }
    }

    if (!targetBranch) {
      targetBranch = repo.branches.keys().next().value
    }

    const branchConfig = repo.branches.get(targetBranch)

    if (!branchConfig) {
      return reply.code(400).send({ error: `Branch "${targetBranch}" not found` })
    }

    const sessionId = request.cookies.sessionId

    try {
      await enableNginx(repoName, sessionId)
      await reloadNginx(sessionId)
    } catch (error) {
      console.warn('Nginx operations warning:', error.message)
    }

    const deploymentLogId = await executeDeployment(
      repoName,
      targetBranch,
      request.user.username
    )

    try {
      await restartPM2(branchConfig.pm2Name)
    } catch (error) {
      console.warn('PM2 restart warning:', error.message)
    }

    return {
      success: true,
      deploymentLogId,
      repository: repoName,
      branch: targetBranch
    }
  })

  fastify.post('/api/deployments/:repoName/reload', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, type } = request.query

    const repo = await Repository.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    let targetBranch = branch

    if (!targetBranch && type) {
      for (const [branchName, branchConfig] of repo.branches) {
        if (branchConfig.type === type) {
          targetBranch = branchName
          break
        }
      }
    }

    if (!targetBranch) {
      targetBranch = repo.branches.keys().next().value
    }

    const branchConfig = repo.branches.get(targetBranch)

    if (!branchConfig) {
      return reply.code(400).send({ error: `Branch "${targetBranch}" not found` })
    }

    try {
      await reloadPM2(branchConfig.pm2Name)
    } catch (error) {
      console.warn('PM2 reload warning:', error.message)
    }

    return {
      success: true,
      repository: repoName,
      branch: targetBranch
    }
  })

  fastify.delete('/api/deployments/:repoName', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, type } = request.query

    const repo = await Repository.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    let targetBranch = branch

    if (!targetBranch && type) {
      for (const [branchName, branchConfig] of repo.branches) {
        if (branchConfig.type === type) {
          targetBranch = branchName
          break
        }
      }
    }

    if (!targetBranch) {
      targetBranch = repo.branches.keys().next().value
    }

    const branchConfig = repo.branches.get(targetBranch)

    if (!branchConfig) {
      return reply.code(400).send({ error: `Branch "${targetBranch}" not found` })
    }

    try {
      await deletePM2(branchConfig.pm2Name)
    } catch (error) {
      console.warn('PM2 delete warning:', error.message)
    }

    return {
      success: true,
      repository: repoName,
      branch: targetBranch
    }
  })
}

module.exports = deploymentsRoutes
