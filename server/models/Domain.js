const mongoose = require('mongoose')

const domainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  certificatePath: {
    type: String
  },
  privateKeyPath: {
    type: String
  }
}, {
  timestamps: true
})

domainSchema.index({ name: 1 })

const Domain = mongoose.model('Domain', domainSchema)

module.exports = Domain
