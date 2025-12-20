import dotenv from 'dotenv'
dotenv.config()

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import path from 'path'
import { connectDB } from './config/database'
import errorHandler from './middleware/error-handler'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import staticPlugin from '@fastify/static'
import rateLimit from '@fastify/rate-limit'
import socketIO from 'fastify-socket.io'

import authRoutes from './routes/auth'
import repoRoutes from './routes/repositories'
import deploymentRoutes from './routes/deployments'
import domainRoutes from './routes/domains'
import templateRoutes from './routes/templates'
import webhookRoutes from './routes/webhook'
import logRoutes from './routes/logs'
import systemRoutes from './routes/system'
import socketHandler from './socket'

const PORT: number = parseInt(process.env.PORT || '50000', 10)

const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
})

async function start() {
  try {
    await connectDB()

    await fastify.register(cookie)

    await fastify.register(cors, {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN || false
        : true,
      credentials: true,
    })

    await fastify.register(staticPlugin, {
      root: path.resolve(__dirname, '../public'),
    })

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '15 minutes',
    })

    await fastify.register(authRoutes)
    await fastify.register(repoRoutes)
    await fastify.register(deploymentRoutes)
    await fastify.register(domainRoutes)
    await fastify.register(templateRoutes)
    await fastify.register(webhookRoutes)
    await fastify.register(logRoutes)
    await fastify.register(systemRoutes)

    await fastify.register(socketIO, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? process.env.CORS_ORIGIN || false
          : true,
        credentials: true,
      },
    })

    socketHandler(fastify as any)

    fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }
    })

    fastify.setErrorHandler(errorHandler)

    await fastify.listen({ port: PORT, host: '0.0.0.0' })

    console.log(`\n✅ Server running on http://localhost:${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health\n`)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()

