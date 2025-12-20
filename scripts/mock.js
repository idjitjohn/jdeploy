#!/usr/bin/env node

require('dotenv').config()
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

const { User, Repository, Domain, Template, Configuration } = require('../server/models')

const configPath = path.join(__dirname, '..', 'deploy.config.json')
const templatesDir = path.join(__dirname, '..', 'templates')

async function mock() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/webhook-deployer'
    console.log(`\nConnecting to MongoDB: ${mongoURI}`)

    await mongoose.connect(mongoURI)
    console.log('✓ Connected to MongoDB\n')

    if (!fs.existsSync(configPath)) {
      console.error(`❌ Config file not found: ${configPath}`)
      console.log('Creating default configuration...\n')
    }

    const config = fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      : { paths: {}, domains: [], repositories: [], self: {} }

    let adminUser = await User.findOne({ username: 'admin' })
    if (!adminUser) {
      const hashedPassword = await User.hashPassword('admin123')
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@localhost',
        passwordHash: hashedPassword,
        role: 'admin'
      })
      console.log('✓ Created admin user')
      console.log('  Username: admin')
      console.log('  Password: admin123\n')
    } else {
      console.log('✓ Admin user already exists\n')
    }

    if (config.paths) {
      await Configuration.findOneAndUpdate(
        { key: 'paths' },
        {
          key: 'paths',
          value: config.paths
        },
        { upsert: true }
      )
      console.log('✓ Migrated paths configuration')
    }

    if (config.self) {
      await Configuration.findOneAndUpdate(
        { key: 'self' },
        {
          key: 'self',
          value: config.self
        },
        { upsert: true }
      )
      console.log('✓ Migrated self configuration')
    }

    if (config.domains && config.domains.length > 0) {
      for (const domain of config.domains) {
        const certificateDir = config.paths.home
          ? path.join(config.paths.home, 'certificate', domain.name)
          : path.join(__dirname, '..', 'text-env', 'certificate', domain.name)

        await Domain.findOneAndUpdate(
          { name: domain.name },
          {
            name: domain.name,
            certificatePath: path.join(certificateDir, 'certificate.crt'),
            privateKeyPath: path.join(certificateDir, 'private.key')
          },
          { upsert: true }
        )
        console.log(`✓ Migrated domain: ${domain.name}`)
      }
    }

    if (fs.existsSync(templatesDir)) {
      const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'))

      for (const file of templateFiles) {
        const templateData = JSON.parse(fs.readFileSync(path.join(templatesDir, file), 'utf-8'))
        const templateName = file.replace('.json', '')

        await Template.findOneAndUpdate(
          { name: templateName },
          {
            name: templateName,
            displayName: templateData.name || templateName,
            description: templateData.description || '',
            commands: templateData.commands || [],
            preDeploy: templateData.preDeploy || [],
            postDeploy: templateData.postDeploy || [],
            nginx: templateData.nginx || { enabled: true, template: [] },
            env: templateData.env || {},
            isSystem: true
          },
          { upsert: true }
        )
        console.log(`✓ Migrated template: ${templateName}`)
      }
    }

    if (config.repositories && config.repositories.length > 0) {
      for (const repo of config.repositories) {
        const branchesMap = new Map()

        if (repo.branches) {
          Object.entries(repo.branches).forEach(([branchName, branchConfig]) => {
            branchesMap.set(branchName, {
              type: branchConfig.type || 'dev',
              pm2Name: branchConfig.pm2Name || `${repo.name}-${branchConfig.type}`,
              preDeploy: branchConfig.preDeploy || [],
              postDeploy: branchConfig.postDeploy || []
            })
          })
        }

        const envMap = new Map()
        if (repo.env) {
          Object.entries(repo.env).forEach(([key, value]) => {
            envMap.set(key, value)
          })
        }

        await Repository.findOneAndUpdate(
          { name: repo.name },
          {
            name: repo.name,
            repoUrl: repo.repoUrl,
            template: repo.template,
            domain: repo.domain,
            port: repo.port,
            commands: repo.commands || [],
            preDeploy: repo.preDeploy || [],
            postDeploy: repo.postDeploy || [],
            nginx: repo.nginx || { enabled: true, template: [] },
            env: envMap,
            branches: branchesMap
          },
          { upsert: true }
        )
        console.log(`✓ Migrated repository: ${repo.name}`)
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\nYou can now start the web server with: yarn dev')
    console.log('Login at http://localhost:50000 with:')
    console.log('  Username: admin')
    console.log('  Password: admin123\n')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Migration error:', error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

mock()
