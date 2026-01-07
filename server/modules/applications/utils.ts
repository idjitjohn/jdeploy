import { getPaths } from '@/server/utils/paths'
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

  const paths = await getPaths()

  // Set deployment config so interpolateVariables uses correct paths
  setDeploymentConfig({ home: paths.home })

  if (!fs.existsSync(paths.nginx)) {
    fs.mkdirSync(paths.nginx, { recursive: true })
  }

  const interpolatedContent = interpolateVariables(nginxTemplate, {
    repoName: context.repoName,
    branch: context.branch,
    port: context.port,
    appId: context.appId,
    subdomain: context.subdomain,
    domain: context.domain
  })

  const configFilePath = path.join(paths.nginx, `${context.appName}.conf`)
  fs.writeFileSync(configFilePath, interpolatedContent, 'utf-8')
}
