import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import DeploymentLogModel from '@/app/api/models/DeploymentLog'
import RepositoryModel from '@/app/api/models/Repository'
import { runDeployment, getLogPath } from '@/lib/deployment'
import { startProcess, savePM2 } from '@/lib/pm2'
import crypto from 'crypto'

const GITHUB_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'your-secret-key'

function verifyGitHubSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', GITHUB_SECRET)
    .update(payload)
    .digest('hex')

  return `sha256=${hash}` === signature
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256') || ''
    const payload = await request.text()

    if (!verifyGitHubSignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(payload)

    if (event.action === 'opened' || event.action === 'synchronize') {
      return await handlePullRequest(event)
    }

    if (event.ref) {
      return await handlePush(event)
    }

    return NextResponse.json(
      { message: 'Event processed' },
      { status: 200 }
    )
  } catch (error) {
    console.error('GitHub webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePush(event: any) {
  try {
    await connectDB()

    const repoUrl = event.repository.clone_url
    const branch = event.ref.split('/').pop()
    const repoName = event.repository.name

    const repo = await RepositoryModel.findOne({ name: repoName })
    if (!repo) {
      return NextResponse.json(
        { message: 'Repository not configured' },
        { status: 200 }
      )
    }

    if (repo.repoUrl !== repoUrl) {
      return NextResponse.json(
        { message: 'Repository URL mismatch' },
        { status: 200 }
      )
    }

    const logPath = getLogPath(repoName)
    const branchConfig = repo.branches.get(branch)
    const env = Object.fromEntries(repo.env || [])

    const log = new DeploymentLogModel({
      repository: repoName,
      branch,
      type: 'webhook',
      status: 'running',
      triggeredBy: event.pusher.name || 'github',
      startedAt: new Date(),
      logFile: logPath,
      webhookPayload: event,
    })
    await log.save()

    runDeployment({
      repoName,
      branch,
      repoUrl,
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
      { message: 'Deployment started' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Handle push error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePullRequest(event: any) {
  const prBranch = event.pull_request.head.ref

  console.log(`Pull request ${event.action} for branch: ${prBranch}`)

  return NextResponse.json(
    { message: 'PR event processed' },
    { status: 200 }
  )
}
