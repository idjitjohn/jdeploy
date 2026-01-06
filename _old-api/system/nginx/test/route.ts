import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/app/api/middleware/auth'
import { testNginxConfig } from '@/lib/nginx'

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

    const result = testNginxConfig()

    return NextResponse.json(
      {
        success: result.valid,
        message: result.valid ? 'Nginx configuration test passed' : result.error,
      },
      { status: result.valid ? 200 : 400 }
    )
  } catch (error) {
    console.error('Nginx test error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
