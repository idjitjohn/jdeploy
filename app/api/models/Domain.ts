import { Schema, model, Document, models } from 'mongoose'

interface Domain extends Document {
  name: string
  certificate?: string
  privateKey?: string
  createdAt: Date
  updatedAt: Date
}

const domainSchema = new Schema<Domain>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  certificate: {
    type: String,
  },
  privateKey: {
    type: String,
  },
}, {
  timestamps: true,
  versionKey: false,
})

const DomainModel = models.Domain || model<Domain>('Domain', domainSchema)

export default DomainModel
