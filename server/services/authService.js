const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const generateJWT = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role
  }

  const secret = process.env.JWT_SECRET || 'change-this-secret-in-production'
  const expiresIn = '24h'

  return jwt.sign(payload, secret, { expiresIn })
}

const verifyJWT = (token) => {
  const secret = process.env.JWT_SECRET || 'change-this-secret-in-production'

  try {
    return jwt.verify(token, secret)
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10)
}

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash)
}

module.exports = {
  generateJWT,
  verifyJWT,
  hashPassword,
  comparePassword
}
