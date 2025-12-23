import mongoose, { Document, Schema } from 'mongoose'

export interface IConfiguration extends Document {
  paths: {
    home: string
    code: string
    release: string
    certificate: string
    logs: string
    nginxAvailable: string
    nginxEnabled: string
  }
  createdAt?: Date
  updatedAt?: Date
}

const configurationSchema = new Schema<IConfiguration>(
  {
    paths: {
      type: {
        home: {
          type: String,
          required: true,
          default: '/var/webhooks'
        },
        code: {
          type: String,
          required: true,
          default: '/var/webhooks/code'
        },
        release: {
          type: String,
          required: true,
          default: '/var/webhooks/release'
        },
        certificate: {
          type: String,
          required: true,
          default: '/var/webhooks/certificate'
        },
        logs: {
          type: String,
          required: true,
          default: '/var/webhooks/logs'
        },
        nginxAvailable: {
          type: String,
          required: true,
          default: '/etc/nginx/sites-available'
        },
        nginxEnabled: {
          type: String,
          required: true,
          default: '/etc/nginx/sites-enabled'
        }
      },
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'configurations'
  }
)

const Configuration = mongoose.models.Configuration || mongoose.model<IConfiguration>('Configuration', configurationSchema)

export default Configuration
