#!/usr/bin/env node

require('dotenv').config()

const fastify = require('fastify')({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
})
const path = require('path')
const { connectDB } = require('./config/database')
const errorHandler = require('./middleware/errorHandler')

const PORT = process.env.PORT || 50000

async function start() {
  try {
    await connectDB()

    await fastify.register(require('@fastify/cookie'))

    await fastify.register(require('@fastify/cors'), {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN || false
        : true,
      credentials: true
    })

    await fastify.register(require('@fastify/static'), {
      root: path.join(__dirname, '../public'),
      prefix: '/'
    })

    await fastify.register(require('@fastify/rate-limit'), {
      max: 100,
      timeWindow: '15 minutes'
    })

    await fastify.register(require('./routes/auth'))
    await fastify.register(require('./routes/repositories'))
    await fastify.register(require('./routes/deployments'))
    await fastify.register(require('./routes/domains'))
    await fastify.register(require('./routes/templates'))
    await fastify.register(require('./routes/webhook'))
    await fastify.register(require('./routes/logs'))
    await fastify.register(require('./routes/system'))

    await fastify.register(require('fastify-socket.io'), {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? process.env.CORS_ORIGIN || false
          : true,
        credentials: true
      }
    })

    require('./socket')(fastify)

    fastify.setErrorHandler(errorHandler)

    fastify.get('/', async (request, reply) => {
      return reply.sendFile('index.html')
    })

    fastify.get('/health', async (request, reply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    })

    await fastify.listen({ port: PORT, host: '0.0.0.0' })

    console.log(`\n✅ Server running on http://localhost:${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health\n`)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
