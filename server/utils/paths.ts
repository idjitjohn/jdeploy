import mongoose from 'mongoose'
import path from 'path'

export interface ConfigPaths {
  home: string
  code: string
  release: string
  certificate: string
  logs: string
  nginx: string
}

// Cache for home path
const lastConfig = { home: '' }

// Helper to get all paths from config
export async function getPaths(): Promise<ConfigPaths> {
  if (!lastConfig.home) {
    const Configuration = mongoose.models.Configuration
    lastConfig.home = (await Configuration.findOne().lean() as any)?.home || ''
  }
  if (!lastConfig.home) throw new Error('Launch the "yarn deploy" or "bun deploy" to init the app')
  const home = lastConfig.home

  return {
    home,
    code: path.join(home, 'code'),
    release: path.join(home, 'release'),
    certificate: path.join(home, 'certificate'),
    logs: path.join(home, 'logs'),
    nginx: path.join(home, 'nginx')
  }
}
