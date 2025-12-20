const mongoose = require('mongoose')

const branchConfigSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['prod', 'staging', 'dev', 'production', 'development'],
    required: true
  },
  pm2Name: {
    type: String,
    required: true
  },
  preDeploy: [String],
  postDeploy: [String]
}, { _id: false })

const nginxConfigSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  template: [String]
}, { _id: false })

const repositorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  repoUrl: {
    type: String,
    required: true
  },
  template: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  port: {
    type: String,
    required: true
  },
  commands: [String],
  preDeploy: {
    type: [String],
    default: []
  },
  postDeploy: {
    type: [String],
    default: []
  },
  nginx: {
    type: nginxConfigSchema,
    default: () => ({ enabled: true, template: [] })
  },
  env: {
    type: Map,
    of: String,
    default: () => new Map()
  },
  branches: {
    type: Map,
    of: branchConfigSchema,
    default: () => new Map()
  }
}, {
  timestamps: true
})

repositorySchema.index({ name: 1 })
repositorySchema.index({ domain: 1 })

const Repository = mongoose.model('Repository', repositorySchema)

module.exports = Repository
