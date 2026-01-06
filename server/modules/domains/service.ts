import { createDomainsService } from './context'
import { Auth } from '../../plugins/auth.types'
import connectDB from '@/lib/db'
import DomainModel from '@/server/models/Domain'

export const list = createDomainsService(
  {
    response: 'ListDomainsRes',
    auth: Auth.USER
  },
  async ({ authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const domains = await DomainModel.find().lean()

    return {
      domains: domains.map((domain: any) => ({
        id: domain._id.toString(),
        name: domain.name,
        certificate: domain.certificate,
        privateKey: domain.privateKey,
        createdAt: domain.createdAt.toISOString(),
        updatedAt: domain.updatedAt.toISOString()
      }))
    }
  }
)

export const get = createDomainsService(
  {
    params: 'IdParam',
    response: 'GetDomainRes',
    auth: Auth.USER
  },
  async ({ params, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const domain = await DomainModel.findById(params.id)

    if (!domain) {
      set.status = 404
      throw new Error('Domain not found')
    }

    return {
      domain: {
        id: domain._id.toString(),
        name: domain.name,
        certificate: domain.certificate,
        privateKey: domain.privateKey,
        createdAt: domain.createdAt.toISOString(),
        updatedAt: domain.updatedAt.toISOString()
      }
    }
  }
)

export const create = createDomainsService(
  {
    body: 'CreateDomainReq',
    response: 'CreateDomainRes',
    auth: Auth.ADMIN
  },
  async ({ body, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const existing = await DomainModel.findOne({ name: body.name })
    if (existing) {
      set.status = 409
      throw new Error('Domain already exists')
    }

    const domain = await DomainModel.create({
      name: body.name,
      certificate: body.certificate,
      privateKey: body.privateKey
    })

    return {
      domain: {
        id: domain._id.toString(),
        name: domain.name,
        certificate: domain.certificate,
        privateKey: domain.privateKey,
        createdAt: domain.createdAt.toISOString(),
        updatedAt: domain.updatedAt.toISOString()
      }
    }
  }
)

export const update = createDomainsService(
  {
    params: 'IdParam',
    body: 'UpdateDomainReq',
    response: 'UpdateDomainRes',
    auth: Auth.ADMIN
  },
  async ({ params, body, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const domain = await DomainModel.findByIdAndUpdate(
      params.id,
      {
        $set: {
          name: body.name,
          certificate: body.certificate,
          privateKey: body.privateKey
        }
      },
      { new: true }
    )

    if (!domain) {
      set.status = 404
      throw new Error('Domain not found')
    }

    return {
      domain: {
        id: domain._id.toString(),
        name: domain.name,
        certificate: domain.certificate,
        privateKey: domain.privateKey,
        createdAt: domain.createdAt.toISOString(),
        updatedAt: domain.updatedAt.toISOString()
      }
    }
  }
)

export const remove = createDomainsService(
  {
    params: 'IdParam',
    response: 'DeleteDomainRes',
    auth: Auth.ADMIN
  },
  async ({ params, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const domain = await DomainModel.findByIdAndDelete(params.id)

    if (!domain) {
      set.status = 404
      throw new Error('Domain not found')
    }

    return {
      message: 'Domain deleted successfully'
    }
  }
)

export const domainsService = {
  list,
  get,
  create,
  update,
  remove
}
