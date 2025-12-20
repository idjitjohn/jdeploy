import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { User } from '../models'
import { generateJWT } from '../services/authService'
import authMiddleware from '../middleware/auth'
import { IUser } from '../models/user'

interface IRequestWithUser extends FastifyRequest {
  user?: IUser
}

async function authRoutes(fastify: FastifyInstance, options: any) {
  fastify.post('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body as any

    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password are required' })
    }

    const user = await User.findOne({ username })

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    user.lastLogin = new Date()
    await user.save()

    const token = generateJWT(user as any)

    reply
      .setCookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      })
      .send({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      })
  })

  fastify.post('/api/auth/logout', async (request, reply) => {
    reply.clearCookie('token').send({ success: true })
  })

  fastify.get('/api/auth/me', { preHandler: authMiddleware }, async (request: IRequestWithUser, reply) => {
    reply.send({
      user: {
        id: request.user!.id,
        username: request.user!.username,
        email: request.user!.email,
        role: request.user!.role,
      },
    })
  })
}

export default authRoutes
