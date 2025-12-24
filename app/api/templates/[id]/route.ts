import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import TemplateModel from '@/app/api/models/Template'
import { verifyAuth } from '@/app/api/middleware/auth'
import { ObjectId } from 'mongodb'

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
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const template = await TemplateModel.findById(id)

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        template: {
          id: template._id?.toString() || id,
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
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get template error:', error)
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
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const data = await request.json()

    const template = await TemplateModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          commands: data.commands || [],
          preDeploy: data.preDeploy || [],
          postDeploy: data.postDeploy || [],
          nginx: data.nginx || { enabled: true, template: [] },
          env: data.env || new Map(),
          isSystem: data.isSystem || false,
        },
      },
      { new: true, runValidators: true }
    )

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

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
          env: template.env instanceof Map ? Object.fromEntries(template.env) : (template.env || {}),
          isSystem: template.isSystem,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update template error:', error)
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
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const template = await TemplateModel.findById(id)

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of system templates
    if (template.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system templates' },
        { status: 403 }
      )
    }

    await TemplateModel.findByIdAndDelete(id)

    return NextResponse.json(
      { message: 'Template deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
