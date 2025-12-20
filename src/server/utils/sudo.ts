import { exec } from 'child_process'

interface SudoSession {
  password: string
  expiresAt: number
}

const sudoSessions = new Map<string, SudoSession>()

const SESSION_EXPIRY = 15 * 60 * 1000; // 15 minutes

export const authenticateSudo = (password: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    exec(`echo '${password}' | sudo -S echo 'test'`, (error) => {
      if (error) {
        return reject(new Error('Invalid sudo password'))
      }
      resolve(true)
    })
  })
}

export const storeSudoSession = (sessionId: string, password: string): void => {
  sudoSessions.set(sessionId, {
    password,
    expiresAt: Date.now() + SESSION_EXPIRY,
  })
}

export const getSudoSession = (sessionId: string): SudoSession | null => {
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

export const executeSudo = (command: string, sessionId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const session = getSudoSession(sessionId)

    if (!session) {
      return reject(new Error('Sudo session expired or not found'))
    }

    exec(`echo '${session.password}' | sudo -S ${command}`, (error, stdout) => {
      if (error) {
        return reject(new Error(`Sudo command failed: ${error.message}`))
      }
      resolve(stdout)
    })
  })
}

export const clearSudoSession = (sessionId: string): void => {
  sudoSessions.delete(sessionId)
}
