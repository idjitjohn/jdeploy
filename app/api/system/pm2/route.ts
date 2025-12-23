import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/app/api/middleware/auth'
import { getProcessList, isPM2Installed } from '@/lib/pm2'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isPM2Installed()) {
      return NextResponse.json(
        {
          processes: [],
          message: 'PM2 is not installed',
          installed: false,
        },
        { status: 200 }
      )
    }

    const processes = getProcessList()

    return NextResponse.json(
      {
        processes,
        installed: true,
        count: processes.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('PM2 status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
