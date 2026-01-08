import { execSync } from 'child_process'
import crypto from 'crypto'
import { getMongoPassword, getConfigFilePath } from './config'

function getAdminPassword(): string | null {
  const password = getMongoPassword()
  if (!password) {
    console.log('[MongoDB] Password not found. Run "yarn deploy" or "bun deploy" first. Config:', getConfigFilePath())
  }
  return password
}

function generatePassword(length = 24): string {
  // Use only alphanumeric chars to avoid URL encoding issues
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

// Escape password for use in shell commands (mongosh --eval)
function escapeForShell(str: string): string {
  return str.replace(/'/g, "'\\''")
}

// Build connection string with URL-encoded credentials
function buildConnectionString(user: string, password: string, db: string): string {
  const encodedUser = encodeURIComponent(user)
  const encodedPassword = encodeURIComponent(password)
  return `mongodb://${encodedUser}:${encodedPassword}@localhost:27017/${db}?authMechanism=DEFAULT&authSource=${db}`
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
export async function createAppDatabase(appName: string): Promise<AppDatabaseResult> {
  console.log(`[MongoDB] Creating database and user for: ${appName}`)

  const adminPassword = getAdminPassword()
  if (!adminPassword) {
    console.log('[MongoDB] Admin password not found')
    return {
      success: false,
      dbName: appName,
      dbUser: appName,
      error: 'MongoDB admin password not found. Run "yarn deploy" or "bun deploy" first.'
    }
  }

  const dbName = appName
  const dbUser = appName
  const dbPassword = generatePassword()
  const escapedAdminPass = escapeForShell(adminPassword)

  try {
    // Check if user already exists
    const checkScript = `db.getSiblingDB('admin').auth('admin', '${escapedAdminPass}'); db.getSiblingDB('${dbName}').getUser('${dbUser}')`
    try {
      const result = execSync(`mongosh --quiet --eval "${checkScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
      if (result && result.trim() !== 'null') {
        // User exists, update password
        console.log(`[MongoDB] User '${dbUser}' already exists, updating password`)
        const updateScript = `db.getSiblingDB('admin').auth('admin', '${escapedAdminPass}'); db.getSiblingDB('${dbName}').changeUserPassword('${dbUser}', '${dbPassword}')`
        execSync(`mongosh --quiet --eval "${updateScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
      } else {
        // Create new user
        console.log(`[MongoDB] Creating new user '${dbUser}' for database '${dbName}'`)
        const createScript = `db.getSiblingDB('admin').auth('admin', '${escapedAdminPass}'); db.getSiblingDB('${dbName}').createUser({user: '${dbUser}', pwd: '${dbPassword}', roles: [{role: 'readWrite', db: '${dbName}'}]})`
        execSync(`mongosh --quiet --eval "${createScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
      }
    } catch {
      // User doesn't exist, create it
      console.log(`[MongoDB] Creating new user '${dbUser}' for database '${dbName}'`)
      const createScript = `db.getSiblingDB('admin').auth('admin', '${escapedAdminPass}'); db.getSiblingDB('${dbName}').createUser({user: '${dbUser}', pwd: '${dbPassword}', roles: [{role: 'readWrite', db: '${dbName}'}]})`
      execSync(`mongosh --quiet --eval "${createScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
    }

    const connectionString = buildConnectionString(dbUser, dbPassword, dbName)

    console.log(`[MongoDB] Successfully created database '${dbName}' with user '${dbUser}'`)
    console.log(`[MongoDB] Connection string: ${connectionString}`)

    return {
      success: true,
      dbName,
      dbUser,
      dbPassword,
      connectionString
    }
  } catch (error: any) {
    console.log(`[MongoDB] Failed to create database: ${error.message}`)
    return {
      success: false,
      dbName,
      dbUser,
      error: error.message
    }
  }
}

// Archive database (rename to $name-old-TIMESTAMP) and drop user for an application
export async function archiveAppDatabase(appName: string): Promise<{ success: boolean; archivedAs?: string; error?: string }> {
  console.log(`[MongoDB] Archiving database for: ${appName}`)

  const adminPassword = getAdminPassword()
  if (!adminPassword) {
    console.log('[MongoDB] Admin password not found')
    return {
      success: false,
      error: 'MongoDB admin password not found'
    }
  }

  const dbName = appName
  const dbUser = appName
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const archivedDbName = `${dbName}-old-${timestamp}`
  const escapedAdminPass = escapeForShell(adminPassword)

  try {
    // Drop user first
    console.log(`[MongoDB] Dropping user '${dbUser}'`)
    const dropUserScript = `db.getSiblingDB('admin').auth('admin', '${escapedAdminPass}'); db.getSiblingDB('${dbName}').dropUser('${dbUser}')`
    try {
      execSync(`mongosh --quiet --eval "${dropUserScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
      console.log(`[MongoDB] User '${dbUser}' dropped`)
    } catch {
      console.log(`[MongoDB] User '${dbUser}' not found or already dropped`)
    }

    // Rename database by copying all collections to new db then dropping original
    console.log(`[MongoDB] Renaming database '${dbName}' to '${archivedDbName}'`)
    const renameScript = `
      db.getSiblingDB('admin').auth('admin', '${escapedAdminPass}');
      var sourceDb = db.getSiblingDB('${dbName}');
      var targetDb = db.getSiblingDB('${archivedDbName}');
      var collections = sourceDb.getCollectionNames();
      if (collections.length === 0) {
        print('NO_COLLECTIONS');
      } else {
        collections.forEach(function(coll) {
          sourceDb.getCollection(coll).find().forEach(function(doc) {
            targetDb.getCollection(coll).insertOne(doc);
          });
        });
        sourceDb.dropDatabase();
        print('RENAMED');
      }
    `
    const result = execSync(`mongosh --quiet --eval "${renameScript}"`, { encoding: 'utf-8', stdio: 'pipe' })

    if (result.includes('NO_COLLECTIONS')) {
      console.log(`[MongoDB] Database '${dbName}' has no collections, dropping it`)
      const dropScript = `db.getSiblingDB('admin').auth('admin', '${escapedAdminPass}'); db.getSiblingDB('${dbName}').dropDatabase()`
      execSync(`mongosh --quiet --eval "${dropScript}"`, { encoding: 'utf-8', stdio: 'pipe' })
      return { success: true }
    }

    console.log(`[MongoDB] Database archived as '${archivedDbName}'`)
    return { success: true, archivedAs: archivedDbName }
  } catch (error: any) {
    console.log(`[MongoDB] Failed to archive database: ${error.message}`)
    return {
      success: false,
      error: error.message
    }
  }
}

// Alias for backward compatibility
export const dropAppDatabase = archiveAppDatabase
