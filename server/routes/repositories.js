const { Repository } = require('../models')
const authMiddleware = require('../middleware/auth')
const { generateNginxConfig, writeNginxConfig } = require('../services/nginxService')
const { execSync } = require('child_process')
const path = require('path')

async function repositoriesRoutes(fastify, options) {
  fastify.get('/api/repositories', { preHandler: authMiddleware }, async (request, reply) => {
    const repositories = await Repository.find().sort({ name: 1 })

    return {
      repositories: repositories.map(repo => ({
        id: repo._id,
        name: repo.name,
        repoUrl: repo.repoUrl,
        template: repo.template,
        domain: repo.domain,
        port: repo.port,
        branches: Object.fromEntries(repo.branches),
        nginx: repo.nginx,
        env: Object.fromEntries(repo.env),
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt
      }))
    }
  })

  fastify.get('/api/repositories/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const repository = await Repository.findById(request.params.id)

    if (!repository) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    return {
      repository: {
        id: repository._id,
        name: repository.name,
        repoUrl: repository.repoUrl,
        template: repository.template,
        domain: repository.domain,
        port: repository.port,
        commands: repository.commands,
        preDeploy: repository.preDeploy,
        postDeploy: repository.postDeploy,
        branches: Object.fromEntries(repository.branches),
        nginx: repository.nginx,
        env: Object.fromEntries(repository.env),
        createdAt: repository.createdAt,
        updatedAt: repository.updatedAt
      }
    }
  })

  fastify.post('/api/repositories', { preHandler: authMiddleware }, async (request, reply) => {
    const { name, repoUrl, template, domain, port, commands, preDeploy, postDeploy, nginx, env, branches } = request.body

    if (!name || !repoUrl || !template || !domain || !port) {
      return reply.code(400).send({ error: 'Missing required fields' })
    }

    const existing = await Repository.findOne({ name })
    if (existing) {
      return reply.code(400).send({ error: 'Repository with this name already exists' })
    }

    const branchesMap = new Map()
    if (branches) {
      Object.entries(branches).forEach(([branchName, branchConfig]) => {
        branchesMap.set(branchName, branchConfig)
      })
    }

    const envMap = new Map()
    if (env) {
      Object.entries(env).forEach(([key, value]) => {
        envMap.set(key, value)
      })
    }

    const repository = await Repository.create({
      name,
      repoUrl,
      template,
      domain,
      port,
      commands: commands || [],
      preDeploy: preDeploy || [],
      postDeploy: postDeploy || [],
      nginx: nginx || { enabled: true, template: [] },
      env: envMap,
      branches: branchesMap
    })

    if (nginx && nginx.enabled && nginx.template && nginx.template.length > 0) {
      const { Configuration } = require('../models')
      const pathsConfig = await Configuration.findOne({ key: 'paths' })

      if (pathsConfig) {
        const configContent = generateNginxConfig(repository, nginx.template, pathsConfig.value)
        await writeNginxConfig(name, configContent)
      }
    }

    const { Configuration } = require('../models')
    const pathsConfig = await Configuration.findOne({ key: 'paths' })

    if (pathsConfig) {
      const codeFolder = path.join(pathsConfig.value.home, 'code', name)

      try {
        execSync(`git clone ${repoUrl} ${codeFolder}`, { stdio: 'inherit' })
      } catch (error) {
        console.error('Failed to clone repository:', error.message)
      }
    }

    return reply.code(201).send({
      repository: {
        id: repository._id,
        name: repository.name,
        repoUrl: repository.repoUrl,
        template: repository.template,
        domain: repository.domain,
        port: repository.port
      }
    })
  })

  fastify.put('/api/repositories/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const repository = await Repository.findById(request.params.id)

    if (!repository) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    const { repoUrl, template, domain, port, commands, preDeploy, postDeploy, nginx, env, branches } = request.body

    if (repoUrl) repository.repoUrl = repoUrl
    if (template) repository.template = template
    if (domain) repository.domain = domain
    if (port) repository.port = port
    if (commands) repository.commands = commands
    if (preDeploy) repository.preDeploy = preDeploy
    if (postDeploy) repository.postDeploy = postDeploy
    if (nginx) repository.nginx = nginx

    if (env) {
      const envMap = new Map()
      Object.entries(env).forEach(([key, value]) => {
        envMap.set(key, value)
      })
      repository.env = envMap
    }

    if (branches) {
      const branchesMap = new Map()
      Object.entries(branches).forEach(([branchName, branchConfig]) => {
        branchesMap.set(branchName, branchConfig)
      })
      repository.branches = branchesMap
    }

    await repository.save()

    return {
      repository: {
        id: repository._id,
        name: repository.name,
        repoUrl: repository.repoUrl,
        template: repository.template,
        domain: repository.domain,
        port: repository.port
      }
    }
  })

  fastify.delete('/api/repositories/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const repository = await Repository.findById(request.params.id)

    if (!repository) {
      return reply.code(404).send({ error: 'Repository not found' })
    }

    const { disableNginx } = require('../services/nginxService')
    const { deletePM2 } = require('../services/pm2Service')

    for (const [branch, branchConfig] of repository.branches) {
      try {
        await deletePM2(branchConfig.pm2Name)
      } catch (error) {
        console.error(`Failed to delete PM2 process: ${error.message}`)
      }
    }

    try {
      await disableNginx(repository.name)
    } catch (error) {
      console.error(`Failed to disable nginx: ${error.message}`)
    }

    await Repository.findByIdAndDelete(request.params.id)

    return { success: true }
  })
}

module.exports = repositoriesRoutes
