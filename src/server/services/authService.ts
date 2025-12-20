import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { User, JwtPayload } from '../types/auth'

export const generateJWT = (user: User): string => {
  const payload: JwtPayload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  }

  const secret = process.env.JWT_SECRET || 'change-this-secret-in-production'
  const expiresIn = '24h'

  return jwt.sign(payload, secret, { expiresIn })
}

export const verifyJWT = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || 'change-this-secret-in-production'

  try {
    return jwt.verify(token, secret) as JwtPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}
