import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/app/api/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const password = data.password

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        authenticated: true,
        message: 'Sudo authentication successful',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Sudo auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
