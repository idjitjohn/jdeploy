import mongoose, { Document, Schema } from 'mongoose'

export interface IConfiguration extends Document {
  home: string
  createdAt?: Date
  updatedAt?: Date
}

const configurationSchema = new Schema<IConfiguration>(
  {
    home: {
      type: String,
      required: true,
      default: '/var/webhooks'
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'configurations'
  }
)

const Configuration = mongoose.models.Configuration || mongoose.model<IConfiguration>('Configuration', configurationSchema)

export default Configuration
