const authMiddleware = require('../middleware/auth')
const { getAllPM2Processes } = require('../services/pm2Service')
const { reloadNginx, testNginxConfig } = require('../services/nginxService')
const { authenticateSudo, storeSudoSession } = require('../utils/sudo')

async function systemRoutes(fastify, options) {
  fastify.get('/api/system/status', { preHandler: authMiddleware }, async (request, reply) => {
    const pm2Processes = getAllPM2Processes()

    return {
      pm2: pm2Processes,
      nginx: {
        status: 'unknown'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  })

  fastify.get('/api/system/pm2', { preHandler: authMiddleware }, async (request, reply) => {
    const processes = getAllPM2Processes()

    return {
      processes
    }
  })

  fastify.post('/api/system/nginx/reload', { preHandler: authMiddleware }, async (request, reply) => {
    const { sudoPassword } = request.body
    const sessionId = request.cookies.sessionId || `session-${Date.now()}`

    try {
      if (sudoPassword) {
        await authenticateSudo(sudoPassword)
        storeSudoSession(sessionId, sudoPassword)

        reply.setCookie('sessionId', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000
        })
      }

      await reloadNginx(sessionId)

      return { success: true }
    } catch (error) {
      return reply.code(500).send({ error: error.message })
    }
  })

  fastify.post('/api/system/nginx/test', { preHandler: authMiddleware }, async (request, reply) => {
    const sessionId = request.cookies.sessionId

    const result = await testNginxConfig(sessionId)

    return result
  })

  fastify.post('/api/system/sudo/authenticate', { preHandler: authMiddleware }, async (request, reply) => {
    const { password } = request.body

    if (!password) {
      return reply.code(400).send({ error: 'Password is required' })
    }

    try {
      await authenticateSudo(password)

      const sessionId = request.cookies.sessionId || `session-${Date.now()}`
      storeSudoSession(sessionId, password)

      reply.setCookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000
      })

      return { success: true, message: 'Sudo password authenticated' }
    } catch (error) {
      return reply.code(401).send({ error: error.message })
    }
  })
}

module.exports = systemRoutes
