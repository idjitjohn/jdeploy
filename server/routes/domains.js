const { Domain, Configuration } = require('../models')
const authMiddleware = require('../middleware/auth')
const path = require('path')
const fs = require('fs')

async function domainsRoutes(fastify, options) {
  fastify.get('/api/domains', { preHandler: authMiddleware }, async (request, reply) => {
    const domains = await Domain.find().sort({ name: 1 })

    return {
      domains: domains.map(domain => ({
        id: domain._id,
        name: domain.name,
        certificatePath: domain.certificatePath,
        privateKeyPath: domain.privateKeyPath,
        createdAt: domain.createdAt
      }))
    }
  })

  fastify.post('/api/domains', { preHandler: authMiddleware }, async (request, reply) => {
    const { name, certificate, privateKey } = request.body

    if (!name || !certificate || !privateKey) {
      return reply.code(400).send({ error: 'Missing required fields' })
    }

    const existing = await Domain.findOne({ name })
    if (existing) {
      return reply.code(400).send({ error: 'Domain already exists' })
    }

    const pathsConfig = await Configuration.findOne({ key: 'paths' })

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

    const domain = await Domain.create({
      name,
      certificatePath,
      privateKeyPath
    })

    return reply.code(201).send({
      domain: {
        id: domain._id,
        name: domain.name,
        certificatePath: domain.certificatePath,
        privateKeyPath: domain.privateKeyPath
      }
    })
  })

  fastify.delete('/api/domains/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const domain = await Domain.findById(request.params.id)

    if (!domain) {
      return reply.code(404).send({ error: 'Domain not found' })
    }

    await Domain.findByIdAndDelete(request.params.id)

    return { success: true }
  })
}

module.exports = domainsRoutes
