import { FastifyRequest } from 'fastify'
import { IUser } from '../models/user'

export interface IRequestWithUser extends FastifyRequest {
  user?: IUser
}

export interface RepositoryParams {
  id: string
}

export interface DomainParams {
  id: string
}

export interface DomainBody {
  name: string
  certificate: string
  privateKey: string
}

export interface TemplateParams {
  id: string
}

export interface TemplateBody {
  name: string
  displayName: string
  description: string
  commands: string[]
  preDeploy: string[]
  postDeploy: string[]
  nginx: {
    enabled: boolean
    template: string[]
  }
  env: { [key: string]: string }
}

export interface DeploymentParams {
  repoName: string
}

export interface DeploymentQuery {
  branch?: string
  type?: string
}

export interface LogsParams {
  repoName: string
  logId: string
}

export interface LogsQuery {
  branch?: string
  status?: string
  limit?: string
  offset?: string
}

export interface SystemBody {
  sudoPassword?: string
  password?: string
}
