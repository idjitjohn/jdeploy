import crypto from 'crypto'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import RepositoryModel from '../models/repository'
import { executeDeployment } from '../services/deploymentService'

async function webhookRoutes(fastify: FastifyInstance, options: any) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
  const WEBHOOK_BRANCH = process.env.WEBHOOK_BRANCH || 'main'

  const verifyGitHubSignature = (body: any, signature: string | undefined): boolean => {
    if (!signature) return false

    const hash =
      'sha256=' +
      crypto
        .createHmac('sha256', WEBHOOK_SECRET as string)
        .update(JSON.stringify(body))
        .digest('hex')

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash))
  }

  const verifyGitLabToken = (token: string | undefined): boolean => {
    return token === WEBHOOK_SECRET
  }

  fastify.post('/api/webhook', async (request, reply) => {
    const isGitHub = request.headers['x-hub-signature-256']
    const isGitLab = request.headers['x-gitlab-token']

    let isValid = false

    if (isGitHub) {
      isValid = verifyGitHubSignature(request.body, isGitHub as string)
    } else if (isGitLab) {
      isValid = verifyGitLabToken(isGitLab as string)
    } else {
      return reply.code(400).send({ error: 'Unknown webhook source' })
    }

    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid signature' })
    }

    let repoName: string | undefined, branch: string | undefined

    if (isGitHub) {
      repoName = (request.body as any).repository?.name
      branch = (request.body as any).ref?.replace('refs/heads/', '')
    } else if (isGitLab) {
      repoName = (request.body as any).project?.name
      branch = (request.body as any).ref?.replace('refs/heads/', '')
    }

    if (!repoName || !branch) {
      return reply.code(400).send({ error: 'Missing repository or branch information' })
    }

    if (WEBHOOK_BRANCH !== '*' && branch !== WEBHOOK_BRANCH) {
      return reply.send({
        received: true,
        skipped: true,
        reason: `Branch ${branch} does not match configured branch ${WEBHOOK_BRANCH}`,
      })
    }

    const repo = await RepositoryModel.findOne({ name: repoName })

    if (!repo) {
      return reply.code(404).send({ error: `Repository "${repoName}" not found in configuration` })
    }

    if (!repo.branches.has(branch)) {
      return reply.send({
        received: true,
        skipped: true,
        reason: `Branch ${branch} not configured for repository ${repoName}`,
      })
    }

    reply.send({
      received: true,
      repository: repoName,
      branch,
    })

    setImmediate(async () => {
      try {
        await executeDeployment(repoName as string, branch as string, 'webhook', request.body)
        fastify.log.info(`Deployment completed for ${repoName}:${branch}`)
      } catch (error) {
        fastify.log.error(`Deployment failed for ${repoName}:${branch}:`, error as any)
      }
    })
  })
}

export default webhookRoutes
