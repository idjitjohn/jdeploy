const mongoose = require('mongoose')

const deploymentLogSchema = new mongoose.Schema({
  repository: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['webhook', 'manual', 'cli'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed'],
    default: 'pending'
  },
  triggeredBy: {
    type: String,
    default: 'system'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  exitCode: {
    type: Number
  },
  logFile: {
    type: String
  },
  errorMessage: {
    type: String
  },
  webhookPayload: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
})

deploymentLogSchema.index({ repository: 1, branch: 1 })
deploymentLogSchema.index({ status: 1 })
deploymentLogSchema.index({ startedAt: -1 })

const DeploymentLog = mongoose.model('DeploymentLog', deploymentLogSchema)

module.exports = DeploymentLog
