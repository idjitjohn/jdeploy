import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import RepositoryModel from '@/app/api/models/Repository'
import { verifyAuth } from '@/app/api/middleware/auth'

export async function DELETE(
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

    if (auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await connectDB()

    const { repoName } = await params

    const repository = await RepositoryModel.findOneAndDelete({ name: repoName })

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Repository deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete repository error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
