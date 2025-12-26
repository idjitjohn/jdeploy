import { Schema, model, Document, models } from 'mongoose'

interface BranchConfig extends Document {
  type: 'prod' | 'staging' | 'dev' | 'production' | 'development'
  pm2Name: string
  preDeploy: string[]
  postDeploy: string[]
}

const branchConfigSchema = new Schema<BranchConfig>({
  type: {
    type: String,
    enum: ['prod', 'staging', 'dev', 'production', 'development'],
    required: true,
  },
  pm2Name: {
    type: String,
    required: true,
  },
  preDeploy: [String],
  postDeploy: [String],
}, { _id: false })

interface Repository extends Document {
  name: string
  repoUrl: string
  template: string
  domain: string
  port: number
  commands: string[]
  preDeploy: string[]
  postDeploy: string[]
  nginx: string
  env: string
  envPath: string
  branches: Map<string, BranchConfig>
  createdAt: Date
  updatedAt: Date
}

const repositorySchema = new Schema<Repository>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  repoUrl: {
    type: String,
    required: true,
  },
  template: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    required: true,
  },
  port: {
    type: Number,
    required: true,
  },
  commands: [String],
  preDeploy: {
    type: [String],
    default: [],
  },
  postDeploy: {
    type: [String],
    default: [],
  },
  nginx: {
    type: String,
    default: '',
  },
  env: {
    type: String,
    default: '',
  },
  envPath: {
    type: String,
    default: '.env',
  },
  branches: {
    type: Map,
    of: branchConfigSchema,
    default: () => new Map(),
  },
}, {
  timestamps: true,
})

repositorySchema.index({ domain: 1 })

const RepositoryModel = models.Repository || model<Repository>('Repository', repositorySchema)

export default RepositoryModel
