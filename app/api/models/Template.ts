import { Schema, model, Document, models } from 'mongoose'

interface Template extends Document {
  name: string
  displayName: string
  description: string
  commands: string[]
  preDeploy: string[]
  postDeploy: string[]
  nginx: string
  env: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

const templateSchema = new Schema<Template>({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
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
  isSystem: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

const TemplateModel = models.Template || model<Template>('Template', templateSchema)

export default TemplateModel
