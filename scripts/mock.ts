#!/usr/bin/env node

import 'dotenv/config'
import mongoose from 'mongoose'
import readline from 'readline'
import User from '@/app/api/models/User'
import ApplicationModel from '@/app/api/models/Application'
import DomainModel from '@/app/api/models/Domain'
import TemplateModel from '@/app/api/models/Template'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webhook-deployer'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function mockUsers() {
  console.log('\n📋 Mocking Users...')
  
  let adminUser = await User.findOne({ username: 'admin' })
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@localhost',
      passwordHash: hashedPassword,
      role: 'admin'
    })
    console.log('✓ Created admin user (admin / admin123)')
  } else {
    console.log('✓ Admin user already exists')
  }

  const testUsers = [
    { username: 'dev', password: 'dev123', email: 'dev@localhost', role: 'user' },
    { username: 'operator', password: 'operator123', email: 'operator@localhost', role: 'user' }
  ]

  for (const userData of testUsers) {
    let user = await User.findOne({ username: userData.username })
    if (!user) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      await User.create({
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role
      })
      console.log(`✓ Created user: ${userData.username} / ${userData.password}`)
    }
  }
}

async function mockDomains() {
  console.log('\n📋 Mocking Domains...')
  
  const domains = [
    { name: 'example.com' },
    { name: 'test.local' },
    { name: 'demo.app' }
  ]

  for (const domain of domains) {
    const existing = await DomainModel.findOne({ name: domain.name })
    if (!existing) {
      await DomainModel.create({ name: domain.name })
      console.log(`✓ Created domain: ${domain.name}`)
    }
  }
}

async function mockTemplates() {
  console.log('\n📋 Mocking Templates...')
  
  const templates = [
    {
      name: 'node',
      displayName: 'Node.js',
      description: 'Standard Node.js project with yarn',
      commands: ['yarn install', 'yarn build'],
      preDeploy: [
        'cd $cf$',
        'git fetch origin $branch$',
        'git reset --hard origin/$branch$',
        'git checkout $branch$'
      ],
      postDeploy: [
        'pm2 restart $pm2Name$',
        'sudo systemctl restart nginx'
      ],
      nginx: '',
      env: '',
      isSystem: true
    },
    {
      name: 'nextjs',
      displayName: 'Next.js',
      description: 'Next.js SSR/SSG application',
      commands: ['yarn install', 'yarn build'],
      preDeploy: [
        'cd $cf$',
        'git fetch origin $branch$',
        'git reset --hard origin/$branch$',
        'git checkout $branch$'
      ],
      postDeploy: [
        'pm2 restart $pm2Name$',
        'sudo systemctl restart nginx'
      ],
      nginx: '',
      env: '',
      isSystem: true
    },
    {
      name: 'react',
      displayName: 'React',
      description: 'React SPA with yarn and build output',
      commands: ['yarn install', 'yarn build'],
      preDeploy: [
        'cd $cf$',
        'git fetch origin $branch$',
        'git reset --hard origin/$branch$',
        'git checkout $branch$'
      ],
      postDeploy: [
        'pm2 restart $pm2Name$',
        'sudo systemctl restart nginx'
      ],
      nginx: '',
      env: '',
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
}

async function mockApplications() {
  console.log('\n📋 Mocking Applications...')
  
  const existingApp = await ApplicationModel.findOne({ name: 'sample-app' })
  if (!existingApp) {
    await ApplicationModel.create({
      name: 'sample-app',
      repoUrl: 'https://github.com/example/sample-app.git',
      template: 'node',
      domain: 'example.com',
      port: 3000,
      commands: ['yarn install', 'yarn build'],
      preDeploy: [],
      postDeploy: [],
      nginx: '',
      env: 'NODE_ENV=production\nPORT=3000',
      envFilePath: '.env',
      branch: 'main',
      status: 'stopped'
    })
    console.log('✓ Created sample application: sample-app')
  }
}

async function mock() {
  try {
    console.log('\n🚀 Mock Data Generator')
    console.log('=====================\n')
    console.log('Select what to mock:')
    console.log('  1. Users')
    console.log('  2. Domains')
    console.log('  3. Templates')
    console.log('  4. Applications')
    console.log('  *. All\n')

    const answer = await question('Enter your choice (e.g., 1,3 or *): ')
    
    console.log('\nConnecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✓ Connected to MongoDB')

    const choices = answer.trim()
    
    if (choices === '*') {
      await mockUsers()
      await mockDomains()
      await mockTemplates()
      await mockApplications()
    } else {
      const selected = choices.split(',').map(s => s.trim())
      
      for (const choice of selected) {
        switch (choice) {
          case '1':
            await mockUsers()
            break
          case '2':
            await mockDomains()
            break
          case '3':
            await mockTemplates()
            break
          case '4':
            await mockApplications()
            break
          default:
            console.log(`⚠ Unknown choice: ${choice}`)
        }
      }
    }

    console.log('\n✅ Mock data setup completed!')
    console.log('\nYou can now start the web server with: yarn dev')
    console.log('Login at http://localhost:50000 with admin / admin123\n')

    await mongoose.disconnect()
    rl.close()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Mock setup error:', error)
    await mongoose.disconnect()
    rl.close()
    process.exit(1)
  }
}

mock()
