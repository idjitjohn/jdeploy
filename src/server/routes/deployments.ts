import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import RepositoryModel from '../models/repository'
import authMiddleware from '../middleware/auth'
import { executeDeployment } from '../services/deploymentService'
import { stopPM2, restartPM2, reloadPM2, deletePM2 } from '../services/pm2Service'
import { enableNginx, disableNginx, reloadNginx } from '../services/nginxService'

interface IParams {
  repoName: string
}

interface IQuery {
  branch?: string
  type?: string
}

interface IRequestWithUser extends FastifyRequest {
  user?: {
    username: string
  }
}

async function deploymentsRoutes(fastify: FastifyInstance, options: any) {
  fastify.post<{ Params: IParams; Querystring: IQuery }>('/api/deployments/:repoName/start', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, type } = request.query

    const repo = await RepositoryModel.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    let targetBranch = branch

    if (!targetBranch && type) {
      for (const [branchName, branchConfig] of repo.branches.entries()) {
        if ((branchConfig as any).type === type) {
          targetBranch = branchName
          break
        }
      }
    }

    if (!targetBranch) {
      targetBranch = repo.branches.keys().next().value
    }

    if (!targetBranch || !repo.branches.has(targetBranch)) {
      return reply.code(400).send({ error: `Branch "${targetBranch}" not found in repository` })
    }

    const sessionId = (request as any).cookies.sessionId

    try {
      await enableNginx(repoName, sessionId)
      await reloadNginx(sessionId)
    } catch (error: any) {
      console.warn('Nginx operations warning:', error.message)
    }

    const deploymentLogId = await executeDeployment(
      repoName,
      targetBranch as string,
      (request as IRequestWithUser).user!.username
    )

    return {
      success: true,
      deploymentLogId,
      repository: repoName,
      branch: targetBranch,
    }
  })

  fastify.post<{ Params: IParams; Querystring: IQuery }>('/api/deployments/:repoName/stop', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, type } = request.query

    const repo = await RepositoryModel.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    let targetBranch = branch

    if (!targetBranch && type) {
      for (const [branchName, branchConfig] of repo.branches.entries()) {
        if ((branchConfig as any).type === type) {
          targetBranch = branchName
          break
        }
      }
    }

    if (!targetBranch) {
      targetBranch = repo.branches.keys().next().value
    }

    const branchConfig = repo.branches.get(targetBranch as string)

    if (!branchConfig) {
      return reply.code(400).send({ error: `Branch "${targetBranch}" not found` })
    }

    const sessionId = (request as any).cookies.sessionId

    try {
      await disableNginx(repoName, sessionId)
      await reloadNginx(sessionId)
    } catch (error: any) {
      console.warn('Nginx operations warning:', error.message)
    }

    try {
      await stopPM2((branchConfig as any).pm2Name)
    } catch (error: any) {
      console.warn('PM2 stop warning:', error.message)
    }

    return {
      success: true,
      repository: repoName,
      branch: targetBranch,
    }
  })

  fastify.post<{ Params: IParams; Querystring: IQuery }>('/api/deployments/:repoName/restart', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, type } = request.query

    const repo = await RepositoryModel.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    let targetBranch = branch

    if (!targetBranch && type) {
      for (const [branchName, branchConfig] of repo.branches.entries()) {
        if ((branchConfig as any).type === type) {
          targetBranch = branchName
          break
        }
      }
    }

    if (!targetBranch) {
      targetBranch = repo.branches.keys().next().value
    }

    const branchConfig = repo.branches.get(targetBranch as string)

    if (!branchConfig) {
      return reply.code(400).send({ error: `Branch "${targetBranch}" not found` })
    }

    const sessionId = (request as any).cookies.sessionId

    try {
      await enableNginx(repoName, sessionId)
      await reloadNginx(sessionId)
    } catch (error: any) {
      console.warn('Nginx operations warning:', error.message)
    }

    const deploymentLogId = await executeDeployment(
      repoName,
      targetBranch as string,
      (request as IRequestWithUser).user!.username
    )

    try {
      await restartPM2((branchConfig as any).pm2Name)
    } catch (error: any) {
      console.warn('PM2 restart warning:', error.message)
    }

    return {
      success: true,
      deploymentLogId,
      repository: repoName,
      branch: targetBranch,
    }
  })

  fastify.post<{ Params: IParams; Querystring: IQuery }>('/api/deployments/:repoName/reload', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, type } = request.query

    const repo = await RepositoryModel.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    let targetBranch = branch

    if (!targetBranch && type) {
      for (const [branchName, branchConfig] of repo.branches.entries()) {
        if ((branchConfig as any).type === type) {
          targetBranch = branchName
          break
        }
      }
    }

    if (!targetBranch) {
      targetBranch = repo.branches.keys().next().value
    }

    const branchConfig = repo.branches.get(targetBranch as string)

    if (!branchConfig) {
      return reply.code(400).send({ error: `Branch "${targetBranch}" not found` })
    }

    try {
      await reloadPM2((branchConfig as any).pm2Name)
    } catch (error: any) {
      console.warn('PM2 reload warning:', error.message)
    }

    return {
      success: true,
      repository: repoName,
      branch: targetBranch,
    }
  })

  fastify.delete<{ Params: IParams; Querystring: IQuery }>('/api/deployments/:repoName', { preHandler: authMiddleware }, async (request, reply) => {
    const { repoName } = request.params
    const { branch, type } = request.query

    const repo = await RepositoryModel.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    let targetBranch = branch

    if (!targetBranch && type) {
      for (const [branchName, branchConfig] of repo.branches.entries()) {
        if ((branchConfig as any).type === type) {
          targetBranch = branchName
          break
        }
      }
    }

    if (!targetBranch) {
      targetBranch = repo.branches.keys().next().value
    }

    const branchConfig = repo.branches.get(targetBranch as string)

    if (!branchConfig) {
      return reply.code(400).send({ error: `Branch "${targetBranch}" not found` })
    }

    try {
      await deletePM2((branchConfig as any).pm2Name)
    } catch (error: any) {
      console.warn('PM2 delete warning:', error.message)
    }

    return {
      success: true,
      repository: repoName,
      branch: targetBranch,
    }
  })
}

export default deploymentsRoutes
