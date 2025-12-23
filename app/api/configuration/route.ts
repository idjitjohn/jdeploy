import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Configuration from '@/app/api/models/Configuration'
import { verifyAuth } from '@/app/api/middleware/auth'

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

    let configuration = await Configuration.findOne()

    if (!configuration) {
      configuration = await Configuration.create({
        paths: {
          home: '/var/webhooks',
          code: '/var/webhooks/code',
          release: '/var/webhooks/release',
          certificate: '/var/webhooks/certificate',
          logs: '/var/webhooks/logs',
          nginxAvailable: '/etc/nginx/sites-available',
          nginxEnabled: '/etc/nginx/sites-enabled'
        }
      })
    }

    return NextResponse.json(
      {
        configuration: {
          id: configuration._id?.toString(),
          paths: configuration.paths,
          createdAt: configuration.createdAt,
          updatedAt: configuration.updatedAt
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get configuration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    if (!data.paths) {
      return NextResponse.json(
        { error: 'Missing paths configuration' },
        { status: 400 }
      )
    }

    await connectDB()

    let configuration = await Configuration.findOne()

    if (!configuration) {
      configuration = await Configuration.create({
        paths: data.paths
      })
    } else {
      configuration.paths = {
        ...configuration.paths,
        ...data.paths
      }
      await configuration.save()
    }

    return NextResponse.json(
      {
        configuration: {
          id: configuration._id?.toString(),
          paths: configuration.paths,
          createdAt: configuration.createdAt,
          updatedAt: configuration.updatedAt
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update configuration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
