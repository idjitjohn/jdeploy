const { verifyJWT } = require('../services/authService')

const authMiddleware = async (request, reply) => {
  try {
    const token = request.cookies.token

    if (!token) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    const decoded = verifyJWT(token)
    request.user = decoded

  } catch (error) {
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }
}

module.exports = authMiddleware
