#!/usr/bin/env node

import 'dotenv/config'
import mongoose from 'mongoose'
import readline from 'readline'
import User from '@/server/models/User'
import DomainModel from '@/server/models/Domain'
import TemplateModel from '@/server/models/Template'
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
      name: 'nextjs',
      displayName: 'Next.js',
      description: 'Next.js SSR/SSG application',
      prebuild: [
        'git fetch origin $branch$',
        'git reset --hard origin/$branch$',
        'git checkout $branch$',
        'yarn install'
      ],
      build: [
        'yarn build',
      ],
      deployment: [],
      launch: [
        'pm2 del "$name$:$id$:$port$" || true',
        'pm2 start "yarn start -p $port$" --name "$name$:$id$:$port$"',
        'sudo systemctl restart nginx'
      ],
      files: [
        { src: '$cf$/package.json', dest: '$rf$', op: 'cp' },
        { src: '$cf$/.next', dest: '$rf$', op: 'mv' },
        { src: '$cf$/.env*', dest: '$rf$', op: 'cp' },
        { src: '$cf$/node_modules', dest: '$rf$/node_modules', op: 'ln' },
        { src: '$rf$/.next', dest: '', op: 'rm' }
      ],
      nginx: `ssl_certificate $crtf$/crt;
ssl_certificate_key $crtf$/key;

server {
  listen 80;
  listen 443 ssl;
  client_max_body_size 500M;
  server_name $subdomain$.$domain$;
  location / {
      proxy_set_header Host $host;
      proxy_pass http://localhost:$port$;
      proxy_redirect off;
  }
}`,
      env: '',
    },
    {
      name: 'react',
      displayName: 'React',
      description: 'React SPA application (Vite/CRA)',
      prebuild: [
        'git fetch origin $branch$',
        'git reset --hard origin/$branch$',
        'git checkout $branch$',
        'yarn install'
      ],
      build: [
        'yarn build',
      ],
      deployment: [],
      launch: [
        'sudo systemctl restart nginx'
      ],
      files: [
        { src: '$cf$/dist', dest: '$rf$', op: 'mv' },
        { src: '$rf$/dist', dest: '', op: 'rm' }
      ],
      nginx: `ssl_certificate $crtf$/crt;
ssl_certificate_key $crtf$/key;

server {
  listen 80;
  listen 443 ssl;
  server_name $subdomain$.$domain$;

  root $rf$/dist;
  index index.html index.htm;

  location / {
    try_files $uri /index.html;
  }
}`,
      env: '',
    },
    {
      name: 'node',
      displayName: 'Node.js',
      description: 'Node.js/Express backend application',
      prebuild: [
        'git fetch origin $branch$',
        'git reset --hard origin/$branch$',
        'git checkout $branch$',
        'yarn install'
      ],
      build: [
        'yarn build || true',
      ],
      deployment: [],
      launch: [
        'pm2 del "$name$:$id$:$port$" || true',
        'pm2 start "yarn start" --name "$name$:$id$:$port$"',
        'sudo systemctl restart nginx'
      ],
      files: [
        { src: '$cf$/package.json', dest: '$rf$', op: 'cp' },
        { src: '$cf$/dist', dest: '$rf$', op: 'mv' },
        { src: '$cf$/.env*', dest: '$rf$', op: 'cp' },
        { src: '$cf$/node_modules', dest: '$rf$/node_modules', op: 'ln' },
        { src: '$rf$/dist', dest: '', op: 'rm' }
      ],
      nginx: `ssl_certificate $crtf$/crt;
ssl_certificate_key $crtf$/key;

server {
  listen 80;
  listen 443 ssl;
  client_max_body_size 500M;
  server_name $subdomain$.$domain$;
  location / {
      proxy_set_header Host $host;
      proxy_pass http://localhost:$port$;
      proxy_redirect off;
  }
}`,
      env: '',
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

async function mock() {
  try {
    console.log('\n🚀 Mock Data Generator')
    console.log('=====================\n')
    console.log('Select what to mock:')
    console.log('  1. Users')
    console.log('  2. Domains')
    console.log('  3. Templates')
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
