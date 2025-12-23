#!/usr/bin/env node

import 'dotenv/config'
import mongoose from 'mongoose'
import User, { IUserModel } from '@/app/api/models/User'
import RepositoryModel from '@/app/api/models/Repository'
import DomainModel from '@/app/api/models/Domain'
import TemplateModel from '@/app/api/models/Template'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webhook-deployer'

async function mock() {
  try {
    console.log('\nConnecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✓ Connected to MongoDB\n')

    // Create admin user
    let adminUser = await User.findOne({ username: 'admin' })
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
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

    // Create test users
    const testUsers = [
      { username: 'dev', password: 'dev123', email: 'dev@localhost', role: 'user' },
      { username: 'operator', password: 'operator123', email: 'operator@localhost', role: 'user' }
    ]

    for (const userData of testUsers) {
      let user = await User.findOne({ username: userData.username })
      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        user = await User.create({
          username: userData.username,
          email: userData.email,
          passwordHash: hashedPassword,
          role: userData.role
        })
        console.log(`✓ Created ${userData.role} user`)
        console.log(`  Username: ${userData.username}`)
        console.log(`  Password: ${userData.password}\n`)
      }
    }

    // Create sample domains
    const domains = [
      { name: 'example.com' },
      { name: 'test.local' },
      { name: 'demo.app' }
    ]

    for (const domain of domains) {
      const existing = await DomainModel.findOne({ name: domain.name })
      if (!existing) {
        await DomainModel.create({
          name: domain.name
        })
        console.log(`✓ Created domain: ${domain.name}`)
      }
    }
    console.log()

    // Create system templates
    const templates = [
      {
        name: 'node',
        displayName: 'Node.js',
        description: 'Standard Node.js project with yarn',
        commands: ['yarn install', 'yarn build'],
        preDeploy: ['yarn ci'],
        postDeploy: ['yarn start'],
        isSystem: true
      },
      {
        name: 'nextjs',
        displayName: 'Next.js',
        description: 'Next.js SSR/SSG application',
        commands: ['yarn install', 'yarn build'],
        preDeploy: ['yarn install'],
        postDeploy: ['yarn start'],
        isSystem: true
      },
      {
        name: 'react',
        displayName: 'React',
        description: 'React SPA with yarn and build output',
        commands: ['yarn install', 'yarn build'],
        preDeploy: [],
        postDeploy: ['pm2 serve build'],
        isSystem: true
      }
    ]

    for (const template of templates) {
      const existing = await TemplateModel.findOne({ name: template.name })
      if (!existing) {
        await TemplateModel.create(template)
        console.log(`✓ Created template: ${template.displayName}`)
      }
    }
    console.log()

    // Create sample repository
    const existingRepo = await RepositoryModel.findOne({ name: 'sample-app' })
    if (!existingRepo) {
      await RepositoryModel.create({
        name: 'sample-app',
        repoUrl: 'https://github.com/example/sample-app.git',
        template: 'node',
        domain: 'example.com',
        port: 3000,
        commands: ['yarn install', 'yarn build'],
        preDeploy: [],
        postDeploy: [],
        nginx: {
          enabled: true,
          template: []
        },
        env: new Map([
          ['NODE_ENV', 'production'],
          ['PORT', '3000']
        ]),
        branches: new Map([
          ['main', {
            type: 'prod',
            pm2Name: 'sample-app-prod',
            preDeploy: [],
            postDeploy: []
          }],
          ['staging', {
            type: 'staging',
            pm2Name: 'sample-app-staging',
            preDeploy: [],
            postDeploy: []
          }]
        ])
      })
      console.log('✓ Created sample repository: sample-app\n')
    }

    console.log('✅ Mock data setup completed!')
    console.log('\nYou can now start the web server with: yarn dev')
    console.log('Login at http://localhost:50000 with:')
    console.log('\n  Admin:')
    console.log('    Username: admin')
    console.log('    Password: admin123')
    console.log('\n  Test Users:')
    console.log('    Username: dev / Password: dev123')
    console.log('    Username: operator / Password: operator123\n')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Mock setup error:', error)
    await mongoose.disconnect()
    process.exit(1)
  }
}

mock()
