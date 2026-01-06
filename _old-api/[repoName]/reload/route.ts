import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import DeploymentLogModel from '@/app/api/models/DeploymentLog'
import { verifyAuth } from '@/app/api/middleware/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repoName: string }> }
) {
  try {
    const auth = await verifyAuth(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const branch = searchParams.get('branch') || 'main'

    const { repoName } = await params

    const log = new DeploymentLogModel({
      repository: repoName,
      branch,
      type: 'manual',
      status: 'pending',
      triggeredBy: auth.username,
      startedAt: new Date(),
    })

    await log.save()

    return NextResponse.json(
      {
        log: {
          id: log._id.toString(),
          repository: log.repository,
          branch: log.branch,
          type: log.type,
          status: log.status,
          triggeredBy: log.triggeredBy,
          startedAt: log.startedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Reload deployment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
