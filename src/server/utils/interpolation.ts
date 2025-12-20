import path from 'path'

export const interpolateVariables = (command: string, variables: Record<string, string>): string => {
  let result = command

  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`\\$${key}\\$`, 'g')
    result = result.replace(pattern, value || '')
  })

  return result
}

interface RepoConfig {
  name: string
  port: number
  domain: string
}

interface BranchConfig {
  type: string
  pm2Name: string
}

interface Paths {
  home: string
}

export const getDeploymentVariables = (
  repoConfig: RepoConfig,
  branch: string,
  branchConfig: BranchConfig,
  paths: Paths
): Record<string, string> => {
  const branchType = branchConfig.type || 'dev'
  const codeFolder = path.join(paths.home, 'code', repoConfig.name)
  const releaseFolder = path.join(paths.home, 'release', repoConfig.name, branchType)

  return {
    cf: codeFolder,
    rf: releaseFolder,
    branch: branch,
    type: branchType,
    pm2Name: branchConfig.pm2Name,
    port: String(repoConfig.port),
    name: repoConfig.name,
    domain: repoConfig.domain,
    home: paths.home,
  }
}
