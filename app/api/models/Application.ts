import { Schema, model, Document, models } from 'mongoose'

export enum ApplicationStatus {
  STOPPED = 'stopped',
  DEPLOYING = 'deploying',
  RUNNING = 'running'
}

interface Application extends Document {
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
  envFilePath: string
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
  envFilePath: {
    type: String,
    default: '.env',
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
})

applicationSchema.index({ domain: 1 })

const ApplicationModel = models.Application || model<Application>('Application', applicationSchema)

export default ApplicationModel
