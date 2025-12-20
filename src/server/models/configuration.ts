import { Schema, model, Document } from 'mongoose'

interface Configuration extends Document {
  key: 'paths' | 'self' | 'system'
  value: any
}

const configurationSchema = new Schema<Configuration>({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['paths', 'self', 'system'],
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
}, {
  timestamps: true,
})

const ConfigurationModel = model<Configuration>('Configuration', configurationSchema)

export default ConfigurationModel
