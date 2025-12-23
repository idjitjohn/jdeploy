import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import RepositoryModel from '@/app/api/models/Repository'
import { verifyAuth } from '@/app/api/middleware/auth'
import { runDeployment, getLogPath } from '@/lib/deployment'

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

    const repositories = await RepositoryModel.find().lean()

    return NextResponse.json(
      {
        repositories: repositories.map((repo: any) => ({
          ...repo,
          id: repo._id.toString(),
          _id: undefined,
          env: repo.env instanceof Map ? Object.fromEntries(repo.env) : (repo.env || {}),
          branches: repo.branches instanceof Map ? Object.fromEntries(repo.branches) : (repo.branches || {}),
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('List repositories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    if (!data.name || !data.repoUrl || !data.template || !data.domain || data.port === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await connectDB()

    const existingRepo = await RepositoryModel.findOne({ name: data.name })
    if (existingRepo) {
      return NextResponse.json(
        { error: 'Repository with this name already exists' },
        { status: 409 }
      )
    }

    const repository = new RepositoryModel({
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
    })

    await repository.save()

    const logPath = getLogPath(data.name)

    runDeployment({
      repoName: data.name,
      branch: 'main',
      repoUrl: data.repoUrl,
      logPath,
      env: data.env ? Object.fromEntries(Object.entries(data.env)) : {},
      commands: data.commands || [],
      preDeploy: data.preDeploy || [],
      postDeploy: data.postDeploy || [],
    }).catch((error) => {
      console.error('Background deployment error:', error)
    })

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
      { status: 201 }
    )
  } catch (error) {
    console.error('Create repository error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
