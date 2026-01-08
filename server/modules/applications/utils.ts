import { getPaths } from '@/server/utils/paths'
import { interpolateVariables, setDeploymentConfig, InterpolationContext } from '@/server/lib/deployment'
import fs from 'fs'
import path from 'path'

export async function writeNginxConfigFile(nginxTemplate: string, app: InterpolationContext) {
  if (!nginxTemplate) return

  const paths = await getPaths()

  // Set deployment config so interpolateVariables uses correct paths
  setDeploymentConfig({ home: paths.home })

  if (!fs.existsSync(paths.nginx)) {
    fs.mkdirSync(paths.nginx, { recursive: true })
  }

  const interpolatedContent = interpolateVariables(nginxTemplate, app)
  const configFilePath = path.join(paths.nginx, `${app.name}.conf`)
  fs.writeFileSync(configFilePath, interpolatedContent, 'utf-8')
}
