const errorHandler = (error, request, reply) => {
  console.error('Error:', error)

  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal server error'

  reply.code(statusCode).send({
    error: {
      message,
      code: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  })
}

module.exports = errorHandler
