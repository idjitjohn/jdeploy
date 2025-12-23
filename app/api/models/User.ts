import mongoose, { Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  username: string
  email: string
  passwordHash: string
  role: 'admin' | 'user'
  lastLogin?: Date
  id?: string
  comparePassword(candidatePassword: string): Promise<boolean>
}

export interface IUserModel extends Model<IUser> {
  hashPassword(password: string): Promise<string>
}

const userSchema = new Schema<IUser, IUserModel>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
})

userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.passwordHash)
}

userSchema.statics.hashPassword = async function(password: string) {
  return bcrypt.hash(password, 10)
}

userSchema.virtual('id').get(function() {
  return this._id.toString()
})

const User = mongoose.models.User || mongoose.model<IUser, IUserModel>('User', userSchema)

export default User
