import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import DomainModel from '../models/domain'
import ConfigurationModel from '../models/configuration'
import authMiddleware from '../middleware/auth'
import path from 'path'
import fs from 'fs'

interface IParams {
  id: string
}

interface IBody {
  name: string
  certificate: string
  privateKey: string
}

async function domainsRoutes(fastify: FastifyInstance, options: any) {
  fastify.get('/api/domains', { preHandler: authMiddleware }, async (request, reply) => {
    const domains = await DomainModel.find().sort({ name: 1 })

    return {
      domains: domains.map((domain) => ({
        id: domain._id,
        name: domain.name,
        certificatePath: domain.certificatePath,
        privateKeyPath: domain.privateKeyPath,
        createdAt: domain.createdAt,
      })),
    }
  })

  fastify.post<{ Body: IBody }>('/api/domains', { preHandler: authMiddleware }, async (request, reply) => {
    const { name, certificate, privateKey } = request.body

    if (!name || !certificate || !privateKey) {
      return reply.code(400).send({ error: 'Missing required fields' })
    }

    const existing = await DomainModel.findOne({ name })
    if (existing) {
      return reply.code(400).send({ error: 'Domain already exists' })
    }

    const pathsConfig = await ConfigurationModel.findOne({ key: 'paths' })

    if (!pathsConfig) {
      return reply.code(500).send({ error: 'Paths configuration not found' })
    }

    const certificateDir = path.join(pathsConfig.value.home, 'certificate', name)

    if (!fs.existsSync(certificateDir)) {
      fs.mkdirSync(certificateDir, { recursive: true })
    }

    const certificatePath = path.join(certificateDir, 'certificate.crt')
    const privateKeyPath = path.join(certificateDir, 'private.key')

    fs.writeFileSync(certificatePath, certificate, 'utf-8')
    fs.writeFileSync(privateKeyPath, privateKey, 'utf-8')

    const domain = await DomainModel.create({
      name,
      certificatePath,
      privateKeyPath,
    })

    return reply.code(201).send({
      domain: {
        id: domain._id,
        name: domain.name,
        certificatePath: domain.certificatePath,
        privateKeyPath: domain.privateKeyPath,
      },
    })
  })

  fastify.delete<{ Params: IParams }>('/api/domains/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const domain = await DomainModel.findById(request.params.id)

    if (!domain) {
      return reply.code(404).send({ error: 'Domain not found' })
    }

    await DomainModel.findByIdAndDelete(request.params.id)

    return { success: true }
  })
}

export default domainsRoutes
