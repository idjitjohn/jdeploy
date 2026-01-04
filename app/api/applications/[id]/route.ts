import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import ApplicationModel from '@/app/api/models/Application'
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
        { error: 'Invalid application ID' },
        { status: 400 }
      )
    }

    const application = await ApplicationModel.findById(id)

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        application: {
          ...application.toObject(),
          id: application._id?.toString() || id,
          _id: undefined,
          nginxConfig: application.nginx || '',
          env: application.env || '',
          envFilePath: application.envFilePath || '.env',
          branch: application.branch || 'main',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get application error:', error)
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
        { error: 'Invalid application ID' },
        { status: 400 }
      )
    }

    const data = await request.json()

    const application = await ApplicationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: data.name,
          repoUrl: data.repoUrl,
          template: data.template,
          domain: data.domain,
          port: data.port,
          prebuild: data.prebuild || [], build: data.build || [], deployment: data.deployment || [], launch: data.launch || [],
          
          
          nginx: data.nginxConfig || '',
          env: data.env || '',
          envFilePath: data.envFilePath || '.env',
          branch: data.branch || 'main',
        },
      },
      { new: true, runValidators: false }
    )

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

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
          
          
          nginxConfig: application.nginx || '',
          env: application.env || '',
          envFilePath: application.envFilePath || '.env',
          branch: application.branch || 'main',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update application error:', error)
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
        { error: 'Invalid application ID' },
        { status: 400 }
      )
    }

    const application = await ApplicationModel.findById(id)

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const appName = application.name
    const branch = application.branch || 'main'

    // Delete from database
    await ApplicationModel.findByIdAndDelete(id)
    
    // Delete all deployment logs for this application
    await DeploymentLogModel.deleteMany({ application: appName })

    // Get configuration to know where files are stored
    const config = await ConfigurationModel.findOne()
    const codePath = config?.paths?.code || '/var/webhooks/code'
    const releasePath = config?.paths?.release || '/var/webhooks/release'
    const logsPath = config?.paths?.logs || '/var/webhooks/logs'

    // Delete code folder (includes branch subfolder)
    const codeAppPath = path.join(codePath, appName, branch)
    if (fs.existsSync(codeAppPath)) {
      fs.rmSync(codeAppPath, { recursive: true, force: true })
    }
    
    // Also delete parent folder if it's empty
    const codeAppParent = path.join(codePath, appName)
    if (fs.existsSync(codeAppParent)) {
      const files = fs.readdirSync(codeAppParent)
      if (files.length === 0) {
        fs.rmdirSync(codeAppParent)
      }
    }

    // Delete release folder
    const releaseAppPath = path.join(releasePath, appName)
    if (fs.existsSync(releaseAppPath)) {
      fs.rmSync(releaseAppPath, { recursive: true, force: true })
    }

    // Delete logs folder
    const logsAppPath = path.join(logsPath, appName)
    if (fs.existsSync(logsAppPath)) {
      fs.rmSync(logsAppPath, { recursive: true, force: true })
    }

    return NextResponse.json(
      { message: 'Application and all associated files deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
