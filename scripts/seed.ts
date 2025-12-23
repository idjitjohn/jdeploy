import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '@/app/api/models/User'
import RepositoryModel from '@/app/api/models/Repository'
import DomainModel from '@/app/api/models/Domain'
import TemplateModel from '@/app/api/models/Template'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webhook-deployer'

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    await User.deleteMany({})
    await RepositoryModel.deleteMany({})
    await DomainModel.deleteMany({})
    await TemplateModel.deleteMany({})

    const adminPassword = await bcrypt.hash('dev123', 10)
    const admin = await User.create({
      username: 'dev',
      email: 'dev@localhost',
      passwordHash: adminPassword,
      role: 'admin'
    })
    console.log('✓ Admin user created (dev/dev123)')

    const userPassword = await bcrypt.hash('operator123', 10)
    const operator = await User.create({
      username: 'operator',
      email: 'operator@localhost',
      passwordHash: userPassword,
      role: 'user'
    })
    console.log('✓ Operator user created (operator/operator123)')

    const nodeTemplate = await TemplateModel.create({
      name: 'node-app',
      displayName: 'Node.js Application',
      description: 'Standard Node.js app with npm',
      commands: ['npm install', 'npm run build'],
      preDeploy: ['npm ci'],
      postDeploy: ['npm run start'],
      isSystem: true
    })
    console.log('✓ Node.js template created')

    const nextTemplate = await TemplateModel.create({
      name: 'nextjs-app',
      displayName: 'Next.js Application',
      description: 'Next.js full-stack app',
      commands: ['yarn install', 'yarn build'],
      preDeploy: ['yarn install'],
      postDeploy: ['yarn start'],
      isSystem: true
    })
    console.log('✓ Next.js template created')

    const domain = await DomainModel.create({
      name: 'example.com'
    })
    console.log('✓ Example domain created')

    const repo = await RepositoryModel.create({
      name: 'my-app',
      repoUrl: 'https://github.com/user/my-app.git',
      template: 'node-app',
      domain: 'example.com',
      port: 3000,
      commands: ['npm install', 'npm run build'],
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
          pm2Name: 'my-app-prod',
          preDeploy: [],
          postDeploy: []
        }],
        ['staging', {
          type: 'staging',
          pm2Name: 'my-app-staging',
          preDeploy: [],
          postDeploy: []
        }]
      ])
    })
    console.log('✓ Sample repository created')

    console.log('\n✅ Database seeded successfully!')
    console.log('\nTest credentials:')
    console.log('Admin: dev / dev123')
    console.log('Operator: operator / operator123')

    process.exit(0)
  } catch (error) {
    console.error('❌ Seed error:', error)
    process.exit(1)
  }
}

seed()
