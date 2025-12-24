import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import RepositoryModel from '@/app/api/models/Repository'
import DeploymentLogModel from '@/app/api/models/DeploymentLog'
import { verifyAuth } from '@/app/api/middleware/auth'
import { runDeployment, getLogPath, setDeploymentConfig } from '@/lib/deployment'
import ConfigurationModel from '@/app/api/models/Configuration'

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
          nginxConfig: repo.nginx || '',
          env: repo.env || '',
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

    // Load configuration
    const config = await ConfigurationModel.findOne()
    if (config?.paths) {
      setDeploymentConfig(config.paths)
    }

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
      nginx: data.nginxConfig || '',
      env: data.env || '',
      branches: data.branches || new Map(),
    })

    await repository.save()

    const logPath = getLogPath(data.name)

    // Create a deployment log record for the initial deployment
    const log = new DeploymentLogModel({
      repository: data.name,
      branch: 'main',
      type: 'initial',
      status: 'running',
      triggeredBy: auth.username,
      startedAt: new Date(),
      logFile: logPath,
    })
    await log.save()

    runDeployment({
      repoName: data.name,
      branch: 'main',
      repoUrl: data.repoUrl,
      logPath,
      port: data.port,
      env: data.env ? Object.fromEntries(Object.entries(data.env)) : {},
      commands: data.commands || [],
      preDeploy: data.preDeploy || [],
      postDeploy: data.postDeploy || [],
    }).then(async (result) => {
      if (result.success) {
        await DeploymentLogModel.findByIdAndUpdate(log._id, {
          status: 'success',
          completedAt: new Date(),
          exitCode: 0
        })
      } else {
        await DeploymentLogModel.findByIdAndUpdate(log._id, {
          status: 'failed',
          completedAt: new Date(),
          exitCode: 1,
          errorMessage: result.error
        })
      }
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
