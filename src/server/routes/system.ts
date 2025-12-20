import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import authMiddleware from '../middleware/auth'
import { getAllPM2Processes } from '../services/pm2Service'
import { reloadNginx, testNginxConfig } from '../services/nginxService'
import { authenticateSudo, storeSudoSession } from '../utils/sudo'

interface IBody {
  sudoPassword?: string
  password?: string
}

async function systemRoutes(fastify: FastifyInstance, options: any) {
  fastify.get('/api/system/status', { preHandler: authMiddleware }, async (request, reply) => {
    const pm2Processes = getAllPM2Processes()

    return {
      pm2: pm2Processes,
      nginx: {
        status: 'unknown',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    }
  })

  fastify.get('/api/system/pm2', { preHandler: authMiddleware }, async (request, reply) => {
    const processes = getAllPM2Processes()

    return {
      processes,
    }
  })

  fastify.post<{ Body: IBody }>('/api/system/nginx/reload', { preHandler: authMiddleware }, async (request, reply) => {
    const { sudoPassword } = request.body
    const sessionId = (request as any).cookies.sessionId || `session-${Date.now()}`

    try {
      if (sudoPassword) {
        await authenticateSudo(sudoPassword)
        storeSudoSession(sessionId, sudoPassword)

        reply.setCookie('sessionId', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000,
        })
      }

      await reloadNginx(sessionId)

      return { success: true }
    } catch (error: any) {
      return reply.code(500).send({ error: error.message })
    }
  })

  fastify.post('/api/system/nginx/test', { preHandler: authMiddleware }, async (request, reply) => {
    const sessionId = (request as any).cookies.sessionId

    const result = await testNginxConfig(sessionId)

    return result
  })

  fastify.post<{ Body: IBody }>('/api/system/sudo/authenticate', { preHandler: authMiddleware }, async (request, reply) => {
    const { password } = request.body

    if (!password) {
      return reply.code(400).send({ error: 'Password is required' })
    }

    try {
      await authenticateSudo(password)

      const sessionId = (request as any).cookies.sessionId || `session-${Date.now()}`
      storeSudoSession(sessionId, password)

      reply.setCookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      })

      return { success: true, message: 'Sudo password authenticated' }
    } catch (error: any) {
      return reply.code(401).send({ error: error.message })
    }
  })
}

export default systemRoutes
