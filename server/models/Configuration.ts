import mongoose, { Document, Schema } from 'mongoose'
import path from 'path'

export interface IConfiguration extends Document {
  home: string
  createdAt?: Date
  updatedAt?: Date
}

// Helper to get all paths from home
export function getPathsFromHome(home: string) {
  return {
    home,
    code: path.join(home, 'code'),
    release: path.join(home, 'release'),
    certificate: path.join(home, 'certificate'),
    logs: path.join(home, 'logs'),
    nginxAvailable: path.join(home, 'nginx', 'sites-available'),
    nginxEnabled: path.join(home, 'nginx', 'sites-enabled')
  }
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
