#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

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

const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`)
const success = (msg) => console.log(`[${new Date().toISOString()}] SUCCESS: ${msg}`)

const generateNginxConfig = (config) => {
  const { domain, subdomain, port } = config.self
  const certificatePath = path.join(config.paths.home, 'certificate', domain)
  const serverName = `${subdomain}.${domain}`

  return `ssl_certificate ${certificatePath}/certificate.crt;
ssl_certificate_key ${certificatePath}/private.key;

server {
  listen 80;
  listen 443 ssl http2;
  server_name ${serverName};

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  client_max_body_size 50M;

  location / {
    proxy_set_header Host $host;
    proxy_pass http://localhost:${port};
    proxy_redirect off;
  }
}
`
}

const main = () => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

    const nginxConfigPath = path.join(config.paths.nginxEnabled, 'webhook-deployer')

    log('Creating nginx configuration file...')

    // Create directory if it doesn't exist
    if (!fs.existsSync(config.paths.nginxEnabled)) {
      fs.mkdirSync(config.paths.nginxEnabled, { recursive: true })
      log(`Created directory: ${config.paths.nginxEnabled}`)
    }

    const nginxConfig = generateNginxConfig(config)
    fs.writeFileSync(nginxConfigPath, nginxConfig)
    success(`Nginx config created at ${nginxConfigPath}`)

    console.log(`\nWebhook endpoint: https://${config.self.domain}/webhook`)
    console.log(`Health check: https://${config.self.domain}/health\n`)
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR: ${err.message}`)
    process.exit(1)
  }
}

main()
