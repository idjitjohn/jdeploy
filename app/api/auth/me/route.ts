import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import User from '@/app/api/models/User'
import { verifyAuth } from '@/app/api/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findById(auth.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
