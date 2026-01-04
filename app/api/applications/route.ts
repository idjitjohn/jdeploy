import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import ApplicationModel from '@/app/api/models/Application'
import DeploymentLogModel from '@/app/api/models/DeploymentLog'
import { verifyAuth } from '@/app/api/middleware/auth'
import { runPrebuild, getLogPath, setDeploymentConfig } from '@/lib/deployment'
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

    const applications = await ApplicationModel.find().lean()

    return NextResponse.json(
      {
        applications: applications.map((repo: any) => ({
          ...repo,
          id: repo._id.toString(),
          _id: undefined,
          nginxConfig: repo.nginx || '',
          env: repo.env || '',
          envFilePath: repo.envFilePath || '.env',
          branch: repo.branch || 'main',
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('List applications error:', error)
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

    const requiredFields = ['name', 'repoUrl', 'template', 'domain']
    if (requiredFields.some(field => !data[field])) {
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

    const existingApp = await ApplicationModel.findOne({ name: data.name })
    if (existingApp) {
      return NextResponse.json(
        { error: 'Application with this name already exists' },
        { status: 409 }
      )
    }

    const application = await ApplicationModel.create({
      name: data.name,
      repoUrl: data.repoUrl,
      template: data.template,
      domain: data.domain,
      port: data.port,
      prebuild: data.prebuild,
      build: data.build || [],
      deployment: data.deployment || [],
      launch: data.launch || [],
      nginx: data.nginxConfig || '',
      env: data.env || '',
      envFilePath: data.envFilePath || '.env',
      branch: data.branch || 'main',
    })


    const logPath = getLogPath(data.name)

    const branch = data.branch || 'main'

    // Create a deployment log record for prebuild
    const log = new DeploymentLogModel({
      application: data.name,
      branch,
      type: 'initial',
      status: 'running',
      triggeredBy: auth.username,
      startedAt: new Date(),
      logFile: logPath,
    })
    await log.save()

    // Run only prebuild on application creation
    runPrebuild({
      repoName: data.name,
      branch: data.branch || 'main',
      repoUrl: data.repoUrl,
      logPath,
      port: data.port,
      env: {},
      prebuild: data.prebuild || [],
      build: [],
      deployment: [],
      launch: [],
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
      console.error('Background preparation error:', error)
    })

    return NextResponse.json(
      {
        application: {
          id: application._id.toString(),
          name: application.name,
          repoUrl: application.repoUrl,
          template: application.template,
          domain: application.domain,
          port: application.port,
          prebuild: application.prebuild, build: application.build, deployment: application.deployment, launch: application.launch,


          nginx: application.nginx,
          env: application.env || '',
          envFilePath: application.envFilePath || '.env',
          branch: application.branch || 'main',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
