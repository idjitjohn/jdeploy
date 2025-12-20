import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyJWT } from '../services/authService'
import { JwtPayload } from '../types/auth'

const authMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const token = request.cookies.token

    if (!token) {
      await reply.code(401).send({ error: 'Authentication required' })
      return
    }

    const jwtPayload = verifyJWT(token) as unknown as JwtPayload
    (request as any).user = jwtPayload

  } catch (error) {
    await reply.code(401).send({ error: 'Invalid or expired token' })
  }
}

export default authMiddleware
