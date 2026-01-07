import { Schema, model, Document, models } from 'mongoose'

export enum ApplicationStatus {
  STOPPED = 'stopped',
  DEPLOYING = 'deploying',
  RUNNING = 'running'
}

export enum ApplicationEnvironment {
  DEV = 'dev',
  PROD = 'prod',
  STAG = 'stag',
  TEST = 'test'
}

type FileOperation = 'cp' | 'mv' | 'ln' | 'rm'

interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

interface Application extends Document {
  name: string
  repoUrl: string
  template: string
  subdomain: string
  domain: string
  port: number
  prebuild: string[]
  build: string[]
  deployment: string[]
  launch: string[]
  files: FileTransfer[]
  nginx: string
  env: string
  envFilePath: string
  environment: ApplicationEnvironment
  branch?: string
  status: ApplicationStatus
  createdAt: Date
  updatedAt: Date
}

const applicationSchema = new Schema<Application>({
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
  subdomain: {
    type: String,
    default: '',
    trim: true,
    match: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
  },
  domain: {
    type: String,
    required: true,
  },
  port: {
    type: Number,
    required: true,
  },
  prebuild: {
    type: [String],
    default: [],
  },
  build: {
    type: [String],
    default: [],
  },
  deployment: {
    type: [String],
    default: [],
  },
  launch: {
    type: [String],
    default: [],
  },
  files: {
    type: [{
      _id: false,
      src: { type: String, required: true },
      dest: { type: String, default: '$rf$' },
      op: { type: String, enum: ['cp', 'mv', 'ln', 'rm'], default: 'cp' }
    }],
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
  envFilePath: {
    type: String,
    default: '.env',
  },
  environment: {
    type: String,
    enum: Object.values(ApplicationEnvironment),
    default: ApplicationEnvironment.PROD,
  },
  branch: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.STOPPED,
  },
}, {
  timestamps: true,
  versionKey: false,
})

applicationSchema.index({ domain: 1 })

const ApplicationModel = models.Application || model<Application>('Application', applicationSchema)

export default ApplicationModel
