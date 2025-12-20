import { ObjectId } from 'mongoose'

export interface User {
  _id: ObjectId | string
  username: string
  email: string
  role: string
}

export interface JwtPayload {
  id: string
  username: string
  email: string
  role: string
}
