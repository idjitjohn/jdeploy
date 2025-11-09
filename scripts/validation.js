const path = require('path')

const validations = {
  validateRepositoryName: (name) => {
    if (!name || typeof name !== 'string') {
      throw new Error('Repository name is required and must be a string')
    }
    if (name.trim().length === 0) {
      throw new Error('Repository name cannot be empty')
    }
    if (!/^[a-zA-Z0-9\-_]+$/.test(name.trim())) {
      throw new Error('Repository name can only contain alphanumeric characters, hyphens, and underscores')
    }
    if (name.length > 100) {
      throw new Error('Repository name must be less than 100 characters')
    }
    return name.trim()
  },

  validateRepositoryUrl: (url) => {
    if (!url || typeof url !== 'string') {
      throw new Error('Repository URL is required and must be a string')
    }
    if (url.trim().length === 0) {
      throw new Error('Repository URL cannot be empty')
    }

    const trimmedUrl = url.trim()
    const isGitUrl = /^(https?:\/\/|git@|file:\/\/)/.test(trimmedUrl)
    const isGitFormat = trimmedUrl.endsWith('.git') || /\.git($|\/)/.test(trimmedUrl)

    if (!isGitUrl) {
      throw new Error('Repository URL must start with https://, http://, git@, or file://')
    }

    return trimmedUrl
  },

  validateDomainName: (name) => {
    if (!name || typeof name !== 'string') {
      throw new Error('Domain name is required and must be a string')
    }
    if (name.trim().length === 0) {
      throw new Error('Domain name cannot be empty')
    }

    const trimmedName = name.trim()
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
    const isValid = domainRegex.test(trimmedName)

    if (!isValid) {
      throw new Error('Invalid domain name format. Example: example.com')
    }

    if (trimmedName.length > 253) {
      throw new Error('Domain name must be less than 253 characters')
    }

    return trimmedName
  },

  validatePort: (port) => {
    if (port === undefined || port === null) {
      throw new Error('Port is required')
    }

    const portNum = parseInt(port, 10)

    if (isNaN(portNum)) {
      throw new Error('Port must be a number')
    }

    if (portNum < 1024 || portNum > 65535) {
      throw new Error('Port must be between 1024 and 65535')
    }

    return portNum.toString()
  },

  validateBranchName: (name) => {
    if (!name || typeof name !== 'string') {
      throw new Error('Branch name is required and must be a string')
    }
    if (name.trim().length === 0) {
      throw new Error('Branch name cannot be empty')
    }

    const trimmedName = name.trim()
    if (!/^[a-zA-Z0-9\-_/.]+$/.test(trimmedName)) {
      throw new Error('Branch name can only contain alphanumeric characters, hyphens, underscores, and slashes')
    }

    if (trimmedName.length > 255) {
      throw new Error('Branch name must be less than 255 characters')
    }

    return trimmedName
  },

  validateBranchType: (type) => {
    if (!type || typeof type !== 'string') {
      throw new Error('Branch type is required and must be a string')
    }

    const validTypes = ['prod', 'staging', 'dev', 'development', 'production']
    const trimmedType = type.trim().toLowerCase()

    if (!validTypes.includes(trimmedType)) {
      throw new Error(`Branch type must be one of: ${validTypes.join(', ')}`)
    }

    const normalizedType = {
      'prod': 'prod',
      'production': 'prod',
      'staging': 'staging',
      'dev': 'dev',
      'development': 'dev'
    }

    return normalizedType[trimmedType]
  },

  validatePM2Name: (name) => {
    if (!name || typeof name !== 'string') {
      throw new Error('PM2 name is required and must be a string')
    }
    if (name.trim().length === 0) {
      throw new Error('PM2 name cannot be empty')
    }

    const trimmedName = name.trim()
    if (!/^[a-zA-Z0-9\-_]+$/.test(trimmedName)) {
      throw new Error('PM2 name can only contain alphanumeric characters, hyphens, and underscores')
    }

    if (trimmedName.length > 255) {
      throw new Error('PM2 name must be less than 255 characters')
    }

    return trimmedName
  },

  validateDirectoryPath: (dirPath) => {
    if (!dirPath || typeof dirPath !== 'string') {
      throw new Error('Directory path is required and must be a string')
    }

    const trimmedPath = dirPath.trim()
    if (trimmedPath.length === 0) {
      throw new Error('Directory path cannot be empty')
    }

    const resolved = path.resolve(trimmedPath)
    if (!resolved.startsWith('/')) {
      throw new Error('Directory path must be absolute (start with /)')
    }

    return resolved
  },

  validateSSLCertificate: (cert) => {
    if (!cert || typeof cert !== 'string') {
      throw new Error('SSL certificate is required and must be a string')
    }

    const trimmedCert = cert.trim()
    if (!trimmedCert.includes('BEGIN CERTIFICATE') || !trimmedCert.includes('END CERTIFICATE')) {
      throw new Error('Invalid SSL certificate format. Must be PEM format')
    }

    return trimmedCert
  },

  validatePrivateKey: (key) => {
    if (!key || typeof key !== 'string') {
      throw new Error('Private key is required and must be a string')
    }

    const trimmedKey = key.trim()
    if (!trimmedKey.includes('BEGIN') || !trimmedKey.includes('END')) {
      throw new Error('Invalid private key format. Must be PEM format')
    }

    return trimmedKey
  },

  validateSubdomain: (subdomain) => {
    if (!subdomain || typeof subdomain !== 'string') {
      throw new Error('Subdomain is required and must be a string')
    }

    const trimmedSubdomain = subdomain.trim()
    if (!/^[a-zA-Z0-9\-]+$/.test(trimmedSubdomain)) {
      throw new Error('Subdomain can only contain alphanumeric characters and hyphens')
    }

    if (trimmedSubdomain.length > 63) {
      throw new Error('Subdomain must be less than 63 characters')
    }

    return trimmedSubdomain
  },

  validateCommand: (cmd) => {
    if (!cmd || typeof cmd !== 'string') {
      throw new Error('Command is required and must be a string')
    }

    const trimmedCmd = cmd.trim()
    if (trimmedCmd.length === 0) {
      throw new Error('Command cannot be empty')
    }

    if (trimmedCmd.length > 5000) {
      throw new Error('Command is too long (max 5000 characters)')
    }

    return trimmedCmd
  }
}

module.exports = validations
