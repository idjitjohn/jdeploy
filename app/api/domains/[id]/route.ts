import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import DomainModel from '@/app/api/models/Domain'
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
        { error: 'Invalid domain ID' },
        { status: 400 }
      )
    }

    const domain = await DomainModel.findById(id)

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ domain }, { status: 200 })
  } catch (error) {
    console.error('Get domain error:', error)
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
        { error: 'Invalid domain ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, certificate, privateKey } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (certificate !== undefined) updateData.certificate = certificate
    if (privateKey !== undefined) updateData.privateKey = privateKey

    const domain = await DomainModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Domain updated successfully', domain },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update domain error:', error)
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
        { error: 'Invalid domain ID' },
        { status: 400 }
      )
    }

    const domain = await DomainModel.findByIdAndDelete(id)

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Domain deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete domain error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
