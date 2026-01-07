import { Schema, model, Document, models } from 'mongoose'

type FileOperation = 'cp' | 'mv' | 'ln' | 'rm'

interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

interface Template extends Document {
  name: string
  displayName: string
  description: string
  prebuild: string[]
  build: string[]
  deployment: string[]
  launch: string[]
  files: FileTransfer[]
  nginx: string
  env: string
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
}, {
  timestamps: true,
  versionKey: false,
})

const TemplateModel = models.Template || model<Template>('Template', templateSchema)

export default TemplateModel
