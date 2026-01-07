import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const NGINX_SITES_DIR = '/etc/nginx/sites-available'
const NGINX_ENABLED_DIR = '/etc/nginx/sites-enabled'

export interface NginxConfig {
  domain: string
  port: number
  proxyPass?: string
  template?: string[]
}

export function testNginxConfig(): { valid: boolean; error?: string } {
  try {
    execSync('nginx -t', { stdio: 'pipe' })
    return { valid: true }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message
    }
  }
}

export function reloadNginx(): { success: boolean; error?: string } {
  try {
    execSync('sudo systemctl reload nginx', { stdio: 'pipe' })
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export function generateNginxConfig(config: NginxConfig): string {
  if (config.template && config.template.length > 0) {
    return config.template.join('\n')
  }

  const proxyPass = config.proxyPass || `http://localhost:${config.port}`

  return `server {
    listen 80;
    server_name ${config.domain};

    location / {
        proxy_pass ${proxyPass};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`
}

export function saveNginxConfig(domain: string, config: string): { success: boolean; error?: string } {
  try {
    const configPath = path.join(NGINX_SITES_DIR, domain)
    fs.writeFileSync(configPath, config)

    const enabledPath = path.join(NGINX_ENABLED_DIR, domain)
    if (!fs.existsSync(enabledPath)) {
      fs.symlinkSync(configPath, enabledPath)
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export function deleteNginxConfig(domain: string): { success: boolean; error?: string } {
  try {
    const enabledPath = path.join(NGINX_ENABLED_DIR, domain)
    const configPath = path.join(NGINX_SITES_DIR, domain)

    if (fs.existsSync(enabledPath)) {
      fs.unlinkSync(enabledPath)
    }

    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export function getNginxConfigPath(domain: string): string {
  return path.join(NGINX_SITES_DIR, domain)
}

export function getNginxEnabledPath(domain: string): string {
  return path.join(NGINX_ENABLED_DIR, domain)
}
