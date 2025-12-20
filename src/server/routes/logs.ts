import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import authMiddleware from '../middleware/auth'
import { getDeploymentLogs, getDeploymentLogById } from '../services/deploymentService'

interface IParams {
  repoName: string
  logId: string
}

interface IQuery {
  branch?: string
  status?: string
  limit?: string
  offset?: string
}

async function logsRoutes(fastify: FastifyInstance, options: any) {
  fastify.get<{ Params: IParams; Querystring: IQuery }>('/api/logs/:repoName', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, status, limit, offset } = request.query

    const queryOptions = {
      branch,
      status,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    }

    const { logs, total } = await getDeploymentLogs(repoName, queryOptions)

    return {
      logs: logs.map((log: any) => ({
        id: log._id,
        repository: log.repository,
        branch: log.branch,
        type: log.type,
        status: log.status,
        triggeredBy: log.triggeredBy,
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        exitCode: log.exitCode,
        errorMessage: log.errorMessage,
      })),
      total,
      limit: queryOptions.limit,
      offset: queryOptions.offset,
    }
  })

  fastify.get<{ Params: IParams }>('/api/logs/deployment/:logId', { preHandler: authMiddleware }, async (request, reply) => {
    const { logId } = request.params

    try {
      const { log, content } = await getDeploymentLogById(logId)

      return {
        log: {
          id: (log as any)._id,
          repository: (log as any).repository,
          branch: (log as any).branch,
          type: (log as any).type,
          status: (log as any).status,
          triggeredBy: (log as any).triggeredBy,
          startedAt: (log as any).startedAt,
          completedAt: (log as any).completedAt,
          exitCode: (log as any).exitCode,
          logFile: (log as any).logFile,
          errorMessage: (log as any).errorMessage,
        },
        content,
      }
    } catch (error: any) {
      return reply.code(404).send({ error: error.message })
    }
  })
}

export default logsRoutes
