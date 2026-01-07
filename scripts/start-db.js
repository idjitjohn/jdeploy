#!/usr/bin/env node

const { execSync } = require('child_process')

// Create MongoDB user for a specific database
// Usage: node create-mongo-user.js <admin_password> <db_name> <db_user> <db_password>

const args = process.argv.slice(2)

if (args.length !== 4) {
  console.error('Usage: node create-mongo-user.js <admin_password> <db_name> <db_user> <db_password>')
  process.exit(1)
}

const [adminPassword, dbName, dbUser, dbPassword] = args

const evalScript = `db.getSiblingDB('admin').auth('admin', '${adminPassword}'); db.getSiblingDB('${dbName}').createUser({user: '${dbUser}', pwd: '${dbPassword}', roles: [{role: 'readWrite', db: '${dbName}'}]})`

const command = `mongosh --eval "${evalScript}"`

try {
  const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' })
  console.log(output)
  console.log(`User '${dbUser}' created for database '${dbName}'`)
} catch (error) {
  console.error('Failed to create user:', error.message)
  process.exit(1)
}
