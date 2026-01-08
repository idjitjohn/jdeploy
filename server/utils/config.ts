import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import os from 'os'

const CONFIG_FILE = path.join(os.homedir(), '.jdeploy.json')

export interface JDeployConfig {
  secret: string
  mongo_pass: string
  home: string
}

// Decrypt with secret (AES-256-CBC)
export function decrypt(encrypted: string, secret: string): string {
  const [ivBase64, data] = encrypted.split(':')
  const key = crypto.createHash('sha256').update(secret).digest()
  const iv = Buffer.from(ivBase64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(data, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// Encrypt with secret (AES-256-CBC)
export function encrypt(text: string, secret: string): string {
  const key = crypto.createHash('sha256').update(secret).digest()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return iv.toString('base64') + ':' + encrypted
}

// Load config from file
export function loadConfig(): JDeployConfig | null {
  if (!fs.existsSync(CONFIG_FILE)) {
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return null
  }
}

// Get MongoDB admin password (decrypted)
export function getMongoPassword(): string | null {
  const config = loadConfig()
  if (!config || !config.secret || !config.mongo_pass) {
    return null
  }
  try {
    return decrypt(config.mongo_pass, config.secret)
  } catch {
    return null
  }
}

// Get home path from config
export function getHomePath(): string | null {
  const config = loadConfig()
  return config?.home || null
}

// Get config file path
export function getConfigFilePath(): string {
  return CONFIG_FILE
}
