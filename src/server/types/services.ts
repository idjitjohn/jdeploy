export interface RepoConfig {
  name: string
  repoUrl: string
  template: string
  domain: string
  port: number
  commands: string[]
  preDeploy: string[]
  postDeploy: string[]
  nginx: {
    enabled: boolean
    template: string[]
  }
  env: Map<string, string>
  branches: Map<string, any>
}

export interface GetDeploymentLogsOptions {
  branch?: string
  status?: string
  limit?: number
  offset?: number
}
