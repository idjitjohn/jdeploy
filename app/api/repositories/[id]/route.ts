import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import RepositoryModel from '@/app/api/models/Repository'
import DeploymentLogModel from '@/app/api/models/DeploymentLog'
import ConfigurationModel from '@/app/api/models/Configuration'
import { verifyAuth } from '@/app/api/middleware/auth'
import { ObjectId } from 'mongodb'
import fs from 'fs'
import path from 'path'

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
          nginxConfig: repository.nginx || '',
          env: repository.env || '',
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
          nginx: data.nginxConfig || '',
          env: data.env || '',
          branches: data.branches || new Map(),
        },
      },
      { new: true, runValidators: false }
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
          nginxConfig: repository.nginx || '',
          env: repository.env || '',
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

    const repository = await RepositoryModel.findById(id)

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    const repoName = repository.name

    // Delete from database
    await RepositoryModel.findByIdAndDelete(id)
    
    // Delete all deployment logs for this repository
    await DeploymentLogModel.deleteMany({ repository: repoName })

    // Get configuration to know where files are stored
    const config = await ConfigurationModel.findOne()
    const codePath = config?.paths?.code || '/var/webhooks/code'
    const releasePath = config?.paths?.release || '/var/webhooks/release'
    const logsPath = config?.paths?.logs || '/var/webhooks/logs'

    // Delete code folder
    const codeRepoPath = path.join(codePath, repoName)
    if (fs.existsSync(codeRepoPath)) {
      fs.rmSync(codeRepoPath, { recursive: true, force: true })
    }

    // Delete release folder
    const releaseRepoPath = path.join(releasePath, repoName)
    if (fs.existsSync(releaseRepoPath)) {
      fs.rmSync(releaseRepoPath, { recursive: true, force: true })
    }

    // Delete logs folder
    const logsRepoPath = path.join(logsPath, repoName)
    if (fs.existsSync(logsRepoPath)) {
      fs.rmSync(logsRepoPath, { recursive: true, force: true })
    }

    return NextResponse.json(
      { message: 'Repository and all associated files deleted successfully' },
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
