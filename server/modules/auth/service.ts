import { createAuthService } from './context'
import { Auth } from '../../plugins/auth.types'
import connectDB from '@/server/lib/db'
import User from '@/server/models/User'

export const login = createAuthService(
  {
    body: 'LoginReq',
    response: 'LoginRes'
  },
  async ({ body, jwt, set }) => {
    const { username, password } = body

    await connectDB()

    const user = await User.findOne({ username })

    if (!user) {
      set.status = 401
      throw new Error('Invalid username or password')
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
      set.status = 401
      throw new Error('Invalid username or password')
    }

    user.lastLogin = new Date()
    await user.save()

    const token = await jwt.sign({
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    })

    const yy = await jwt.verify(token)
    console.log('UUUUUUUUUUUUUUUU >>>>>', yy)
    // Set cookie for browser compatibility
    set.cookie = {
      token: {
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/'
      }
    }

    const response = {
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role
      },
      token
    }

    console.log('[Login Response]', JSON.stringify(response, null, 2))

    return response
  }
)

export const me = createAuthService(
  {
    response: 'MeRes',
    auth: Auth.USER
  },
  async ({ authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const user = await User.findById(authData.userId)

    if (!user) {
      set.status = 404
      throw new Error('User not found')
    }

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin?.toISOString()
      }
    }
  }
)

export const logout = createAuthService(
  {
    response: 'LogoutRes'
  },
  async ({ set }) => {
    // Clear cookie
    set.cookie = {
      token: {
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      }
    }

    return {
      message: 'Logged out successfully'
    }
  }
)

export const authService = {
  login,
  me,
  logout
}
