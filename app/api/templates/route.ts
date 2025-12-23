import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import TemplateModel from '@/app/api/models/Template'
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

    const templates = await TemplateModel.find().lean()

    return NextResponse.json(
      {
        templates: templates.map((template: any) => ({
          id: template._id.toString(),
          name: template.name,
          displayName: template.displayName,
          description: template.description,
          commands: template.commands,
          preDeploy: template.preDeploy,
          postDeploy: template.postDeploy,
          nginx: template.nginx,
          env: template.env instanceof Map ? Object.fromEntries(template.env) : (template.env || {}),
          isSystem: template.isSystem,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('List templates error:', error)
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

    if (!data.name || !data.displayName || !data.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await connectDB()

    const existingTemplate = await TemplateModel.findOne({ name: data.name })
    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 409 }
      )
    }

    const template = new TemplateModel({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      commands: data.commands || [],
      preDeploy: data.preDeploy || [],
      postDeploy: data.postDeploy || [],
      nginx: data.nginx || { enabled: true, template: [] },
      env: data.env || new Map(),
      isSystem: data.isSystem || false,
    })

    await template.save()

    return NextResponse.json(
      {
        template: {
          id: template._id.toString(),
          name: template.name,
          displayName: template.displayName,
          description: template.description,
          commands: template.commands,
          preDeploy: template.preDeploy,
          postDeploy: template.postDeploy,
          nginx: template.nginx,
          env: Object.fromEntries(template.env || []),
          isSystem: template.isSystem,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
