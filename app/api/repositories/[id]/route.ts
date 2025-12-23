import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import RepositoryModel from '@/app/api/models/Repository'
import { verifyAuth } from '@/app/api/middleware/auth'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid repository ID' },
        { status: 400 }
      )
    }

    const repository = await RepositoryModel.findById(id)

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        repository: {
          ...repository,
          id: repository._id?.toString() || id,
          _id: undefined,
          env: repository.env instanceof Map ? Object.fromEntries(repository.env) : (repository.env || {}),
          branches: repository.branches instanceof Map ? Object.fromEntries(repository.branches) : (repository.branches || {}),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get repository error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid repository ID' },
        { status: 400 }
      )
    }

    const data = await request.json()

    const repository = await RepositoryModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: data.name,
          repoUrl: data.repoUrl,
          template: data.template,
          domain: data.domain,
          port: data.port,
          commands: data.commands || [],
          preDeploy: data.preDeploy || [],
          postDeploy: data.postDeploy || [],
          nginx: data.nginx || { enabled: true, template: [] },
          env: data.env || new Map(),
          branches: data.branches || new Map(),
        },
      },
      { new: true, runValidators: true }
    )

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        repository: {
          id: repository._id.toString(),
          name: repository.name,
          repoUrl: repository.repoUrl,
          template: repository.template,
          domain: repository.domain,
          port: repository.port,
          commands: repository.commands,
          preDeploy: repository.preDeploy,
          postDeploy: repository.postDeploy,
          nginx: repository.nginx,
          env: repository.env instanceof Map ? Object.fromEntries(repository.env) : (repository.env || {}),
          branches: repository.branches instanceof Map ? Object.fromEntries(repository.branches) : (repository.branches || {}),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update repository error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid repository ID' },
        { status: 400 }
      )
    }

    const repository = await RepositoryModel.findByIdAndDelete(id)

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
