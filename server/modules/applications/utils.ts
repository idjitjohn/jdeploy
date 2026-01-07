import ConfigurationModel, { getPathsFromHome } from '@/server/models/Configuration'
import { interpolateVariables, setDeploymentConfig } from '@/server/lib/deployment'
import fs from 'fs'
import path from 'path'

interface NginxContext {
  appName: string
  repoName: string
  branch: string
  port?: number
  appId?: string
  subdomain?: string
  domain?: string
}

export async function writeNginxConfigFile(nginxTemplate: string, context: NginxContext) {
  if (!nginxTemplate) return

  const config = await ConfigurationModel.findOne().lean()
  const home = config?.home || '/var/webhooks'
  const paths = getPathsFromHome(home)
  const nginxPath = paths.nginx

  // Set deployment config so interpolateVariables uses correct paths
  setDeploymentConfig({ home })

  if (!fs.existsSync(nginxPath)) {
    fs.mkdirSync(nginxPath, { recursive: true })
  }

  const interpolatedContent = interpolateVariables(nginxTemplate, {
    repoName: context.repoName,
    branch: context.branch,
    port: context.port,
    appId: context.appId,
    subdomain: context.subdomain,
    domain: context.domain
  })

  const configFilePath = path.join(nginxPath, `${context.appName}.conf`)
  fs.writeFileSync(configFilePath, interpolatedContent, 'utf-8')
}
