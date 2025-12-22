#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { validateRepositoryName, validateRepositoryUrl, validateDomainName, validatePort, validateBranchName, validateBranchType, validatePM2Name } = require('./validation')

const configPath = path.join(__dirname, '..', 'deploy.config.json')

// Check if config is initialized
if (!fs.existsSync(configPath)) {
  console.error('❌ Configuration not initialized')
  console.error('Please run: yarn self-deploy')
  process.exit(1)
}

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  if (!config.self) {
    console.error('❌ Configuration not initialized')
    console.error('Please run: yarn self-deploy')
    process.exit(1)
  }
} catch {
  console.error('❌ Configuration not initialized')
  console.error('Please run: yarn self-deploy')
  process.exit(1)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise(resolve => rl.question(query, resolve))
const templatesDir = path.join(__dirname, '..', 'templates')

const loadTemplates = () => {
  const templates = {}
  if (!fs.existsSync(templatesDir)) {
    return templates
  }
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'))
  files.forEach(file => {
    const name = file.replace('.json', '')
    const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8')
    templates[name] = JSON.parse(content)
  })
  return templates
}

const templates = loadTemplates()

const readConfig = () => {
  if (!fs.existsSync(configPath)) {
    console.error('❌ Configuration not found: deploy.config.json')
    console.error('Stopping all PM2 processes...')

    try {
      require('child_process').execSync('pm2 kill', { stdio: 'pipe' })
      console.log('All PM2 processes stopped')
    } catch (err) {
      console.warn('⚠️  Could not stop PM2 processes')
    }

    throw new Error('Configuration not initialized. Please run: yarn self-deploy')
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(content)

    if (!config.self || !config.paths) {
      console.error('❌ Invalid configuration: Missing required fields')
      console.error('Stopping all PM2 processes...')

      try {
        require('child_process').execSync('pm2 kill', { stdio: 'pipe' })
        console.log('All PM2 processes stopped')
      } catch (err) {
        console.warn('⚠️  Could not stop PM2 processes')
      }

      throw new Error('Configuration not initialized. Please run: yarn self-deploy')
    }

    return config
  } catch (err) {
    if (err.message.includes('Configuration not initialized')) {
      throw err
    }

    console.error('❌ Failed to read configuration: ' + err.message)
    console.error('Stopping all PM2 processes...')

    try {
      require('child_process').execSync('pm2 kill', { stdio: 'pipe' })
      console.log('All PM2 processes stopped')
    } catch (killErr) {
      console.warn('⚠️  Could not stop PM2 processes')
    }

    throw new Error('Configuration not initialized. Please run: yarn self-deploy')
  }
}

const writeConfig = (config) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')
}

const promptRepoDetails = async () => {
  console.log('\n--- Add New Repository ---\n')

  const name = await question('Application name (e.g., my-app): ')
  try {
    var validatedName = validateRepositoryName(name)
  } catch (err) {
    console.error(`Error: ${err.message}`)
    return null
  }

  const repoUrl = await question('Repository URL (e.g., git@github.com:org/my-app.git): ')
  try {
    var validatedUrl = validateRepositoryUrl(repoUrl)
  } catch (err) {
    console.error(`Error: ${err.message}`)
    return null
  }

  const config = readConfig()
  if (config.repositories.some(r => r.name === validatedName)) {
    console.error(`Error: Repository "${validatedName}" already exists`)
    return null
  }

  return { name: validatedName, repoUrl: validatedUrl }
}

const promptBranchDetails = async (repoName) => {
  console.log(`\n--- Add Branch for "${repoName}" ---\n`)

  const branch = await question('Branch name (e.g., main, staging, develop): ')
  try {
    var validatedBranch = validateBranchName(branch)
  } catch (err) {
    console.error(`Error: ${err.message}`)
    return null
  }

  console.log('\nBranch type options:')
  console.log('1. prod')
  console.log('2. staging')
  console.log('3. dev')

  const typeChoice = await question('\nSelect branch type (1-3): ')
  let type
  try {
    const typeMap = { '1': 'prod', '2': 'staging', '3': 'dev' }
    type = validateBranchType(typeMap[typeChoice] || 'dev')
  } catch (err) {
    console.error(`Error: ${err.message}`)
    type = 'dev'
  }

  const defaultPm2Name = `${repoName}-${type}`
  const pm2Name = await question(`PM2 app name (default: ${defaultPm2Name}): `)
  let finalPm2Name
  try {
    finalPm2Name = pm2Name.trim() ? validatePM2Name(pm2Name) : defaultPm2Name
  } catch (err) {
    console.error(`Error: ${err.message}`)
    return null
  }

  return {
    branch: validatedBranch,
    type,
    pm2Name: finalPm2Name
  }
}

const promptAddMore = async () => {
  const answer = await question('\nAdd another branch? (y/n): ')
  return answer.toLowerCase() === 'y'
}

const promptDomain = async () => {
  const config = readConfig()
  const domains = config.domains || []

  if (domains.length === 0) {
    console.log('\n⚠ No domains available. Please add a domain first using: yarn domain')
    return null
  }

  console.log('\nAvailable domains:')
  domains.forEach((domain, index) => {
    console.log(`${index + 1}. ${domain.name}`)
  })

  const domainChoice = await question(`\nSelect domain (1-${domains.length}): `)
  const domainIndex = parseInt(domainChoice) - 1

  if (domainIndex >= 0 && domainIndex < domains.length) {
    return domains[domainIndex].name
  }

  console.log('Invalid choice')
  return null
}

const promptPort = async () => {
  const port = await question('Application port (e.g., 3000): ')
  try {
    return validatePort(port)
  } catch (err) {
    console.error(`Error: ${err.message}`)
    return null
  }
}

const main = async () => {
  try {
    const repoDetails = await promptRepoDetails()
    if (!repoDetails) {
      rl.close()
      process.exit(1)
    }

    console.log('\nTemplate options:')
    const templateNames = Object.keys(templates).sort()
    templateNames.forEach((name, index) => {
      const tpl = templates[name]
      console.log(`${index + 1}. ${tpl.name} - ${tpl.description}`)
    })
    console.log(`${templateNames.length + 1}. Custom`)

    const selectedTemplate = await question(`\nSelect template (1-${templateNames.length + 1}): `)

    let selectedTemplateName = null
    let templateData = null
    const templateIndex = parseInt(selectedTemplate) - 1

    if (templateIndex >= 0 && templateIndex < templateNames.length) {
      selectedTemplateName = templateNames[templateIndex]
      templateData = templates[selectedTemplateName]
    } else if (selectedTemplate === `${templateNames.length + 1}`) {
      selectedTemplateName = 'custom'
      templateData = {
        name: 'Custom',
        description: 'Custom configuration',
        commands: [],
        preDeploy: [],
        postDeploy: [],
        nginx: { enabled: true, template: [] },
        env: {}
      }
      console.log('\nEnter commands (one per line, enter empty line when done):')
      let cmd = ''
      while (true) {
        cmd = await question(`Command ${templateData.commands.length + 1}: `)
        if (cmd === '') break
        templateData.commands.push(cmd.trim())
      }
    } else {
      console.log(`Invalid choice, using ${templateNames[0]} template`)
      selectedTemplateName = templateNames[0]
      templateData = templates[selectedTemplateName]
    }

    const domain = await promptDomain()
    if (!domain) {
      rl.close()
      process.exit(1)
    }

    const port = await promptPort()
    if (!port) {
      rl.close()
      process.exit(1)
    }

    const branches = {}
    let addMore = true

    while (addMore) {
      const branchDetails = await promptBranchDetails(repoDetails.name)
      if (!branchDetails) {
        rl.close()
        process.exit(1)
      }

      const branchConfig = {
        type: branchDetails.type,
        pm2Name: branchDetails.pm2Name
      }

      branches[branchDetails.branch] = branchConfig
      addMore = await promptAddMore()
    }

    const config = readConfig()
    const newRepo = {
      name: repoDetails.name,
      repoUrl: repoDetails.repoUrl,
      template: selectedTemplateName,
      domain,
      port,
      commands: templateData.commands,
      preDeploy: templateData.preDeploy,
      postDeploy: templateData.postDeploy,
      nginx: templateData.nginx,
      env: templateData.env,
      branches
    }

    config.repositories.push(newRepo)
    writeConfig(config)

    const firstBranch = Object.keys(branches)[0]
    const firstBranchType = branches[firstBranch].type

    console.log(`\n✓ Repository "${repoDetails.name}" added to configuration!`)
    console.log(`\nConfiguration saved to: ${configPath}`)

    const codeDir = path.join(config.paths.home, 'code', repoDetails.name)
    const releaseDir = path.join(config.paths.home, 'release', repoDetails.name)

    console.log('\nSetting up directories and cloning repository...')

    try {
      const { execSync } = require('child_process')

      if (!fs.existsSync(codeDir)) {
        console.log(`Creating directory: ${codeDir}`)
        fs.mkdirSync(codeDir, { recursive: true })
      }

      if (!fs.existsSync(releaseDir)) {
        console.log(`Creating directory: ${releaseDir}`)
        fs.mkdirSync(releaseDir, { recursive: true })
      }

      console.log(`\nCloning repository from ${repoDetails.repoUrl}...`)
      execSync(`git clone ${repoDetails.repoUrl} ${codeDir}`, { stdio: 'inherit' })
      console.log(`✓ Repository cloned successfully to ${codeDir}`)

      console.log('\nDirectory structure created:')
      console.log(`  Code:    ${codeDir}`)
      console.log(`  Release: ${releaseDir}`)

      console.log('\n📋 Setting up nginx configuration...')
      const nginxAvailable = config.paths.nginxAvailable
      const nginxConfFile = path.join(nginxAvailable, `${repoDetails.name}.conf`)

      if (!fs.existsSync(nginxAvailable)) {
        fs.mkdirSync(nginxAvailable, { recursive: true })
      }

      const nginxTemplate = config.repositories.find(r => r.name === repoDetails.name).nginx.template
      const nginxConfig = nginxTemplate.map(line => {
        return line
          .replace(/\$home\$/g, config.paths.home)
          .replace(/\$name\$/g, repoDetails.name)
          .replace(/\$domain\$/g, domain)
          .replace(/\$port\$/g, port)
          .replace(/\$type\$/g, firstBranchType)
      }).join('\n')

      fs.writeFileSync(nginxConfFile, nginxConfig + '\n')
      console.log(`✓ Nginx config created: ${nginxConfFile}`)

      console.log('\n✅ Repository fully setup!')
      console.log(`\nNext steps:`)
      console.log(`1. Start your application (pm2 or manually)`)
      console.log(`   Example: pm2 start app.js --name ${branches[firstBranch].pm2Name}`)
      console.log(`\n2. Enable and start with listener:`)
      console.log(`   yarn listener start ${repoDetails.name}`)
      console.log(`\n3. Add webhook in GitHub/GitLab:`)
      console.log(`   URL: https://hook.${config.self.domain}:${config.self.port}/webhook`)

    } catch (error) {
      console.error(`\n⚠️  Error during setup:`)
      console.error(`   ${error.message}`)
      console.log('\nRepository configuration saved, but manual setup required:')
      console.log(`1. Create directories: mkdir -p ${codeDir} ${releaseDir}`)
      console.log(`2. Clone repo: git clone ${repoDetails.repoUrl} ${codeDir}`)
      console.log(`3. Generate nginx config and start PM2:`)
      console.log(`   yarn listener start ${repoDetails.name}`)
    }

    rl.close()
  } catch (error) {
    console.error('Error:', error.message)
    rl.close()
    process.exit(1)
  }
}

main()
