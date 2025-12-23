import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import DomainModel from '@/app/api/models/Domain'
import { verifyAuth } from '@/app/api/middleware/auth'
import { generateNginxConfig, saveNginxConfig } from '@/lib/nginx'

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

    const domains = await DomainModel.find().lean()

    return NextResponse.json(
      {
        domains: domains.map((domain: any) => ({
          id: domain._id.toString(),
          name: domain.name,
          certificate: domain.certificate ? domain.certificate.substring(0, 50) + '...' : null,
          privateKey: domain.privateKey ? '***REDACTED***' : null,
          createdAt: domain.createdAt,
          updatedAt: domain.updatedAt,
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('List domains error:', error)
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

    if (!data.name) {
      return NextResponse.json(
        { error: 'Domain name is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const existingDomain = await DomainModel.findOne({ name: data.name.toLowerCase() })
    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 409 }
      )
    }

    const domain = new DomainModel({
      name: data.name.toLowerCase(),
      certificate: data.certificate,
      privateKey: data.privateKey,
    })

    await domain.save()

    const nginxConfig = generateNginxConfig({
      domain: domain.name,
      port: data.port || 3000,
      template: data.nginxTemplate
    })

    const nginxResult = saveNginxConfig(domain.name, nginxConfig)
    if (!nginxResult.success) {
      console.warn(`Failed to save nginx config: ${nginxResult.error}`)
    }

    return NextResponse.json(
      {
        domain: {
          id: domain._id.toString(),
          name: domain.name,
          certificate: domain.certificate ? domain.certificate.substring(0, 50) + '...' : null,
          privateKey: domain.privateKey ? '***REDACTED***' : null,
          createdAt: domain.createdAt,
          updatedAt: domain.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create domain error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
