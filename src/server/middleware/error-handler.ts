import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'

const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  console.error('Error:', error)

  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal server error'

  reply.code(statusCode).send({
    error: {
      message,
      code: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  })
}

export default errorHandler

