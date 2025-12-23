import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import User from '@/app/api/models/User'
import { createToken } from '@/app/api/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({ username })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    user.lastLogin = new Date()
    await user.save()

    const token = await createToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    })

    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
        },
      },
      { status: 200 }
    )

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
