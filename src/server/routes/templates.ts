import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import TemplateModel from '../models/template'
import authMiddleware from '../middleware/auth'

interface IParams {
  id: string
}

interface IBody {
  name: string
  displayName: string
  description: string
  commands: string[]
  preDeploy: string[]
  postDeploy: string[]
  nginx: {
    enabled: boolean
    template: string[]
  }
  env: { [key: string]: string }
}

async function templatesRoutes(fastify: FastifyInstance, options: any) {
  fastify.get('/api/templates', { preHandler: authMiddleware }, async (request, reply) => {
    const templates = await TemplateModel.find().sort({ isSystem: -1, name: 1 })

    return {
      templates: templates.map((template) => ({
        id: template._id,
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        commands: template.commands,
        preDeploy: template.preDeploy,
        postDeploy: template.postDeploy,
        nginx: template.nginx,
        env: Object.fromEntries(template.env),
        isSystem: template.isSystem,
        createdAt: template.createdAt,
      })),
    }
  })

  fastify.get<{ Params: IParams }>('/api/templates/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const template = await TemplateModel.findById(request.params.id)

    if (!template) {
      return reply.code(404).send({ error: 'Template not found' })
    }

    return {
      template: {
        id: template._id,
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        commands: template.commands,
        preDeploy: template.preDeploy,
        postDeploy: template.postDeploy,
        nginx: template.nginx,
        env: Object.fromEntries(template.env),
        isSystem: template.isSystem,
      },
    }
  })

  fastify.post<{ Body: IBody }>('/api/templates', { preHandler: authMiddleware }, async (request, reply) => {
    const { name, displayName, description, commands, preDeploy, postDeploy, nginx, env } = request.body

    if (!name || !displayName || !description) {
      return reply.code(400).send({ error: 'Missing required fields' })
    }

    const existing = await TemplateModel.findOne({ name })
    if (existing) {
      return reply.code(400).send({ error: 'Template with this name already exists' })
    }

    const envMap = new Map()
    if (env) {
      Object.entries(env).forEach(([key, value]) => {
        envMap.set(key, value)
      })
    }

    const template = await TemplateModel.create({
      name,
      displayName,
      description,
      commands: commands || [],
      preDeploy: preDeploy || [],
      postDeploy: postDeploy || [],
      nginx: nginx || { enabled: true, template: [] },
      env: envMap,
      isSystem: false,
    })

    return reply.code(201).send({
      template: {
        id: template._id,
        name: template.name,
        displayName: template.displayName,
        description: template.description,
      },
    })
  })

  fastify.put<{ Params: IParams; Body: IBody }>('/api/templates/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const template = await TemplateModel.findById(request.params.id)

    if (!template) {
      return reply.code(404).send({ error: 'Template not found' })
    }

    if (template.isSystem) {
      return reply.code(403).send({ error: 'Cannot modify system templates' })
    }

    const { displayName, description, commands, preDeploy, postDeploy, nginx, env } = request.body

    if (displayName) template.displayName = displayName
    if (description) template.description = description
    if (commands) template.commands = commands
    if (preDeploy) template.preDeploy = preDeploy
    if (postDeploy) template.postDeploy = postDeploy
    if (nginx) template.nginx = nginx as any

    if (env) {
      const envMap = new Map()
      Object.entries(env).forEach(([key, value]) => {
        envMap.set(key, value)
      })
      template.env = envMap
    }

    await template.save()

    return {
      template: {
        id: template._id,
        name: template.name,
        displayName: template.displayName,
        description: template.description,
      },
    }
  })

  fastify.delete<{ Params: IParams }>('/api/templates/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const template = await TemplateModel.findById(request.params.id)

    if (!template) {
      return reply.code(404).send({ error: 'Template not found' })
    }

    if (template.isSystem) {
      return reply.code(403).send({ error: 'Cannot delete system templates' })
    }

    await TemplateModel.findByIdAndDelete(request.params.id)

    return { success: true }
  })
}

export default templatesRoutes
