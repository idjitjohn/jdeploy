import { NextRequest, NextResponse } from 'next/server'
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

    return NextResponse.json(
      {
        status: 'online',
        uptime: process.uptime(),
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('System status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
