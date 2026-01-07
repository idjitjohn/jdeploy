import { createTemplatesService } from './context'
import { Auth } from '../../plugins/auth.types'
import connectDB from '@/server/lib/db'
import TemplateModel from '@/server/models/Template'

export const list = createTemplatesService(
  {
    response: 'ListTemplatesRes',
    auth: Auth.USER
  },
  async ({ authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const templates = await TemplateModel.find().lean()

    return {
      templates: templates.map((template: any) => ({
        id: template._id.toString(),
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        prebuild: template.prebuild || [],
        build: template.build || [],
        deployment: template.deployment || [],
        launch: template.launch || [],
        files: template.files || [],
        nginxConfig: template.nginx || '',
        env: template.env || '',
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      }))
    }
  }
)

export const get = createTemplatesService(
  {
    params: 'IdParam',
    response: 'GetTemplateRes',
    auth: Auth.USER
  },
  async ({ params, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const template = await TemplateModel.findById(params.id)

    if (!template) {
      set.status = 404
      throw new Error('Template not found')
    }

    return {
      template: {
        id: template._id.toString(),
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        prebuild: template.prebuild || [],
        build: template.build || [],
        deployment: template.deployment || [],
        launch: template.launch || [],
        files: template.files || [],
        nginxConfig: template.nginx || '',
        env: template.env || '',
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      }
    }
  }
)

export const create = createTemplatesService(
  {
    body: 'CreateTemplateReq',
    response: 'CreateTemplateRes',
    auth: Auth.ADMIN
  },
  async ({ body, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const existing = await TemplateModel.findOne({ name: body.name })
    if (existing) {
      set.status = 409
      throw new Error('Template with this name already exists')
    }

    const template = await TemplateModel.create({
      name: body.name,
      displayName: body.displayName,
      description: body.description,
      prebuild: body.prebuild || [],
      build: body.build || [],
      deployment: body.deployment || [],
      launch: body.launch || [],
      files: body.files || [],
      nginx: body.nginxConfig || '',
      env: body.env || ''
    })

    return {
      template: {
        id: template._id.toString(),
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        prebuild: template.prebuild || [],
        build: template.build || [],
        deployment: template.deployment || [],
        launch: template.launch || [],
        files: template.files || [],
        nginxConfig: template.nginx || '',
        env: template.env || '',
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      }
    }
  }
)

export const update = createTemplatesService(
  {
    params: 'IdParam',
    body: 'UpdateTemplateReq',
    response: 'UpdateTemplateRes',
    auth: Auth.ADMIN
  },
  async ({ params, body, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const template = await TemplateModel.findByIdAndUpdate(
      params.id,
      {
        $set: {
          name: body.name,
          displayName: body.displayName,
          description: body.description,
          prebuild: body.prebuild || [],
          build: body.build || [],
          deployment: body.deployment || [],
          launch: body.launch || [],
          files: body.files || [],
          nginx: body.nginxConfig || '',
          env: body.env || ''
        }
      },
      { new: true }
    )

    if (!template) {
      set.status = 404
      throw new Error('Template not found')
    }

    return {
      template: {
        id: template._id.toString(),
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        prebuild: template.prebuild || [],
        build: template.build || [],
        deployment: template.deployment || [],
        launch: template.launch || [],
        files: template.files || [],
        nginxConfig: template.nginx || '',
        env: template.env || '',
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      }
    }
  }
)

export const remove = createTemplatesService(
  {
    params: 'IdParam',
    response: 'DeleteTemplateRes',
    auth: Auth.ADMIN
  },
  async ({ params, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const template = await TemplateModel.findById(params.id)

    if (!template) {
      set.status = 404
      throw new Error('Template not found')
    }

    await TemplateModel.findByIdAndDelete(params.id)

    return {
      message: 'Template deleted successfully'
    }
  }
)

export const templatesService = {
  list,
  get,
  create,
  update,
  remove
}
