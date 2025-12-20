import { Schema, model, Document } from 'mongoose'

interface Domain extends Document {
  name: string
  certificatePath?: string
  privateKeyPath?: string
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
  },
  certificatePath: {
    type: String,
  },
  privateKeyPath: {
    type: String,
  },
}, {
  timestamps: true,
})

domainSchema.index({ name: 1 })

const DomainModel = model<Domain>('Domain', domainSchema)

export default DomainModel
