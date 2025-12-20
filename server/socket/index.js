const { getAllPM2Processes } = require('../services/pm2Service')

function setupSocketIO(fastify) {
  const io = fastify.io

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('subscribe:pm2', () => {
      socket.join('pm2-status')
    })

    socket.on('unsubscribe:pm2', () => {
      socket.leave('pm2-status')
    })

    socket.on('subscribe:deployment', ({ repository, branch }) => {
      const room = `deployment:${repository}:${branch}`
      socket.join(room)
    })

    socket.on('unsubscribe:deployment', ({ repository, branch }) => {
      const room = `deployment:${repository}:${branch}`
      socket.leave(room)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  const pm2StatusInterval = setInterval(() => {
    const processes = getAllPM2Processes()

    io.to('pm2-status').emit('pm2:status', {
      processes,
      timestamp: new Date().toISOString()
    })
  }, 5000)

  io.on('close', () => {
    clearInterval(pm2StatusInterval)
  })
}

module.exports = setupSocketIO
