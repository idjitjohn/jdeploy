import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const MONGO_PASS_FILE = path.join(process.cwd(), 'mongo.admin.pass')

function getAdminPassword(): string | null {
  if (!fs.existsSync(MONGO_PASS_FILE)) {
    return null
  }
  return fs.readFileSync(MONGO_PASS_FILE, 'utf-8').trim()
}

function generatePassword(length = 24): string {
  return crypto.randomBytes(length).toString('base64').slice(0, length)
}

export interface AppDatabaseResult {
  success: boolean
  dbName: string
  dbUser: string
  dbPassword?: string
  connectionString?: string
  error?: string
}

// Create a database and user for an application
export function createAppDatabase(appName: string): AppDatabaseResult {
  const adminPassword = getAdminPassword()
  if (!adminPassword) {
    return {
      success: false,
      dbName: appName,
      dbUser: appName,
      error: 'MongoDB admin password not found. Run "yarn deploy" first.'
    }
  }

  const dbName = appName
  const dbUser = appName
  const dbPassword = generatePassword()

  try {
    // Check if user already exists
    const checkScript = `db.getSiblingDB('admin').auth('admin', '${adminPassword}'); db.getSiblingDB('${dbName}').getUser('${dbUser}')`
    try {
      const result = execSync(`mongosh --quiet --eval "${checkScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
      if (result && result.trim() !== 'null') {
        // User exists, update password
        const updateScript = `db.getSiblingDB('admin').auth('admin', '${adminPassword}'); db.getSiblingDB('${dbName}').changeUserPassword('${dbUser}', '${dbPassword}')`
        execSync(`mongosh --quiet --eval "${updateScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
      } else {
        // Create new user
        const createScript = `db.getSiblingDB('admin').auth('admin', '${adminPassword}'); db.getSiblingDB('${dbName}').createUser({user: '${dbUser}', pwd: '${dbPassword}', roles: [{role: 'readWrite', db: '${dbName}'}]})`
        execSync(`mongosh --quiet --eval "${createScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
      }
    } catch {
      // User doesn't exist, create it
      const createScript = `db.getSiblingDB('admin').auth('admin', '${adminPassword}'); db.getSiblingDB('${dbName}').createUser({user: '${dbUser}', pwd: '${dbPassword}', roles: [{role: 'readWrite', db: '${dbName}'}]})`
      execSync(`mongosh --quiet --eval "${createScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
    }

    const connectionString = `mongodb://${dbUser}:${dbPassword}@localhost:27017/${dbName}?authMechanism=DEFAULT&authSource=${dbName}`

    return {
      success: true,
      dbName,
      dbUser,
      dbPassword,
      connectionString
    }
  } catch (error: any) {
    return {
      success: false,
      dbName,
      dbUser,
      error: error.message
    }
  }
}

// Drop database and user for an application
export function dropAppDatabase(appName: string): { success: boolean; error?: string } {
  const adminPassword = getAdminPassword()
  if (!adminPassword) {
    return {
      success: false,
      error: 'MongoDB admin password not found'
    }
  }

  const dbName = appName
  const dbUser = appName

  try {
    // Drop user first
    const dropUserScript = `db.getSiblingDB('admin').auth('admin', '${adminPassword}'); db.getSiblingDB('${dbName}').dropUser('${dbUser}')`
    try {
      execSync(`mongosh --quiet --eval "${dropUserScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
    } catch {
      // User might not exist
    }

    // Drop database
    const dropDbScript = `db.getSiblingDB('admin').auth('admin', '${adminPassword}'); db.getSiblingDB('${dbName}').dropDatabase()`
    execSync(`mongosh --quiet --eval "${dropDbScript}"`, { encoding: 'utf-8', stdio: 'pipe' })

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}
