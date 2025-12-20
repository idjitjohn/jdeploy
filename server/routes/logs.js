const authMiddleware = require('../middleware/auth')
const { getDeploymentLogs, getDeploymentLogById } = require('../services/deploymentService')

async function logsRoutes(fastify, options) {
  fastify.get('/api/logs/:repoName', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, status, limit, offset } = request.query

    const options = {
      branch,
      status,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    }

    const { logs, total } = await getDeploymentLogs(repoName, options)

    return {
      logs: logs.map(log => ({
        id: log._id,
        repository: log.repository,
        branch: log.branch,
        type: log.type,
        status: log.status,
        triggeredBy: log.triggeredBy,
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        exitCode: log.exitCode,
        errorMessage: log.errorMessage
      })),
      total,
      limit: options.limit,
      offset: options.offset
    }
  })

  fastify.get('/api/logs/deployment/:logId', { preHandler: authMiddleware }, async (request, reply) => {
    const { logId } = request.params

    try {
      const { log, content } = await getDeploymentLogById(logId)

      return {
        log: {
          id: log._id,
          repository: log.repository,
          branch: log.branch,
          type: log.type,
          status: log.status,
          triggeredBy: log.triggeredBy,
          startedAt: log.startedAt,
          completedAt: log.completedAt,
          exitCode: log.exitCode,
          logFile: log.logFile,
          errorMessage: log.errorMessage
        },
        content
      }
    } catch (error) {
      return reply.code(404).send({ error: error.message })
    }
  })
}

module.exports = logsRoutes
