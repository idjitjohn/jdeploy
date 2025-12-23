import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import DeploymentLogModel from '@/app/api/models/DeploymentLog'
import RepositoryModel from '@/app/api/models/Repository'
import { verifyAuth } from '@/app/api/middleware/auth'
import { runDeployment, getLogPath } from '@/lib/deployment'
import { startProcess, savePM2 } from '@/lib/pm2'

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

    const repo = await RepositoryModel.findOne({ name: repoName })
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    const logPath = getLogPath(repoName)
    const branchConfig = repo.branches.get(branch)
    const env = Object.fromEntries(repo.env || [])

    const log = new DeploymentLogModel({
      repository: repoName,
      branch,
      type: 'manual',
      status: 'running',
      triggeredBy: auth.username,
      startedAt: new Date(),
      logFile: logPath,
    })
    await log.save()

    runDeployment({
      repoName: repoName,
      branch,
      repoUrl: repo.repoUrl,
      logPath,
      env,
      commands: repo.commands || [],
      preDeploy: repo.preDeploy || [],
      postDeploy: repo.postDeploy || [],
    }).then(async (result) => {
      const pm2Name = branchConfig?.pm2Name || `${repoName}-${branch}`

      if (result.success) {
        startProcess(pm2Name, 'npm start', {
          instances: 1,
          exec_mode: 'fork',
          env
        })
        savePM2()

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
        log: {
          id: log._id.toString(),
          repository: log.repository,
          branch: log.branch,
          type: log.type,
          status: log.status,
          triggeredBy: log.triggeredBy,
          startedAt: log.startedAt,
          logFile: logPath,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Start deployment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
