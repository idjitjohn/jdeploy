const { exec } = require('child_process')

const sudoSessions = new Map()

const SESSION_EXPIRY = 15 * 60 * 1000

const authenticateSudo = (password) => {
  return new Promise((resolve, reject) => {
    exec(`echo '${password}' | sudo -S echo 'test'`, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error('Invalid sudo password'))
      }
      resolve(true)
    })
  })
}

const storeSudoSession = (sessionId, password) => {
  sudoSessions.set(sessionId, {
    password,
    expiresAt: Date.now() + SESSION_EXPIRY
  })
}

const getSudoSession = (sessionId) => {
  const session = sudoSessions.get(sessionId)

  if (!session) {
    return null
  }

  if (session.expiresAt < Date.now()) {
    sudoSessions.delete(sessionId)
    return null
  }

  session.expiresAt = Date.now() + SESSION_EXPIRY

  return session
}

const executeSudo = (command, sessionId) => {
  return new Promise((resolve, reject) => {
    const session = getSudoSession(sessionId)

    if (!session) {
      return reject(new Error('Sudo session expired or not found'))
    }

    exec(`echo '${session.password}' | sudo -S ${command}`, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Sudo command failed: ${error.message}`))
      }
      resolve(stdout)
    })
  })
}

const clearSudoSession = (sessionId) => {
  sudoSessions.delete(sessionId)
}

module.exports = {
  authenticateSudo,
  storeSudoSession,
  getSudoSession,
  executeSudo,
  clearSudoSession
}
