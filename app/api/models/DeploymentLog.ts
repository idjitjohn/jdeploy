import { Schema, model, Document, models } from 'mongoose'

interface DeploymentLog extends Document {
  repository: string
  branch: string
  type: 'webhook' | 'manual' | 'cli'
  status: 'pending' | 'running' | 'success' | 'failed'
  triggeredBy: string
  startedAt: Date
  completedAt?: Date
  exitCode?: number
  logFile?: string
  errorMessage?: string
  webhookPayload?: any
  createdAt: Date
  updatedAt: Date
}

const deploymentLogSchema = new Schema<DeploymentLog>({
  repository: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['webhook', 'manual', 'cli'],
    default: 'manual',
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed'],
    default: 'pending',
  },
  triggeredBy: {
    type: String,
    default: 'system',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  exitCode: {
    type: Number,
  },
  logFile: {
    type: String,
  },
  errorMessage: {
    type: String,
  },
  webhookPayload: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
})

deploymentLogSchema.index({ repository: 1, branch: 1 })
deploymentLogSchema.index({ status: 1 })
deploymentLogSchema.index({ startedAt: -1 })

const DeploymentLogModel = models.DeploymentLog || model<DeploymentLog>('DeploymentLog', deploymentLogSchema)

export type DeploymentLogDocument = DeploymentLog
export default DeploymentLogModel
