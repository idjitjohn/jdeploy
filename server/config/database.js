const mongoose = require('mongoose')

let isConnected = false

const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected')
    return
  }

  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/webhook-deployer'

    await mongoose.connect(mongoURI)

    isConnected = true
    console.log('MongoDB connected successfully')

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected')
      isConnected = false
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}

module.exports = { connectDB }
