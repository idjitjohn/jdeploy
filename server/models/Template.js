const mongoose = require('mongoose')

const nginxTemplateSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  template: [String]
}, { _id: false })

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
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
    type: nginxTemplateSchema,
    default: () => ({ enabled: true, template: [] })
  },
  env: {
    type: Map,
    of: String,
    default: () => new Map()
  },
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

templateSchema.index({ name: 1 })

const Template = mongoose.model('Template', templateSchema)

module.exports = Template
