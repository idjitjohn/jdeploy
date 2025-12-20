const mongoose = require('mongoose')

const configurationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['paths', 'self', 'system']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
})

const Configuration = mongoose.model('Configuration', configurationSchema)

module.exports = Configuration
