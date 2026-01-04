import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import ApplicationModel from '@/app/api/models/Application'
import DeploymentLogModel from '@/app/api/models/DeploymentLog'
import ConfigurationModel from '@/app/api/models/Configuration'
import { verifyAuth } from '@/app/api/middleware/auth'
import { runDeployment, getLogPath, setDeploymentConfig } from '@/lib/deployment'
import { ObjectId } from 'mongodb'

export async function POST(
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

    const repo = await ApplicationModel.findById(id)

    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    // Load configuration
    const config = await ConfigurationModel.findOne()
    if (config?.paths) {
      setDeploymentConfig(config.paths)
    }

    const logPath = getLogPath(repo.name)
    const branch = repo.branch || 'main'
    const env = {}

    // Create deployment log record
    const log = new DeploymentLogModel({
      application: repo.name,
      branch,
      type: 'manual',
      status: 'running',
      triggeredBy: auth.username,
      startedAt: new Date(),
      logFile: logPath,
    })
    await log.save()

    // Run deployment in background
    const result = await runDeployment({
      repoName: repo.name,
      branch,
      repoUrl: repo.repoUrl,
      logPath,
      port: repo.port,
      env,
      envFileContent: repo.env || '',
      envFilePath: repo.envFilePath || '.env',
      prebuild: repo.prebuild || [], build: repo.build || [], deployment: repo.deployment || [], launch: repo.launch || [],
    }).catch((error) => {
      console.error('Background deployment error:', error)
    })

    if (result?.success) {
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
        errorMessage: result?.error
      })
    }

    return NextResponse.json(
      {
        log: {
          id: log._id.toString(),
          application: repo.name,
          branch,
          type: 'manual',
          status: 'running',
          triggeredBy: auth.username,
          startedAt: log.startedAt,
          logFile: logPath,
        },
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('Redeploy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
