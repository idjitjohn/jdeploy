import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/app/api/middleware/auth'
import { reloadNginx } from '@/lib/nginx'

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

    const result = reloadNginx()

    return NextResponse.json(
      {
        success: result.success,
        message: result.success ? 'Nginx reloaded successfully' : result.error,
      },
      { status: result.success ? 200 : 500 }
    )
  } catch (error) {
    console.error('Nginx reload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
