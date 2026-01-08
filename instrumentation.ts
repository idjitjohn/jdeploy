import fs from 'fs'
import path from 'path'
import os from 'os'

const CONFIG_FILE = path.join(os.homedir(), '.jdeploy.json')

export async function register() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('\n========================================')
    console.error('ERROR: Configuration file not found!')
    console.error(`Expected: ${CONFIG_FILE}`)
    console.error('')
    console.error('Please run "yarn deploy" or "bun deploy" first to set up the application.')
    console.error('========================================\n')
    process.exit(1)
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    if (!config.secret || !config.mongo_pass || !config.home) {
      console.error('\n========================================')
      console.error('ERROR: Invalid configuration!')
      console.error(`Config file: ${CONFIG_FILE}`)
      console.error('')
      console.error('Missing required fields: secret, mongo_pass, or home')
      console.error('Please run "yarn deploy" or "bun deploy" to reconfigure.')
      console.error('========================================\n')
      process.exit(1)
    }

    console.log(`[Config] Loaded from ${CONFIG_FILE}`)
    console.log(`[Config] Home: ${config.home}`)
  } catch (error) {
    console.error('\n========================================')
    console.error('ERROR: Failed to read configuration!')
    console.error(`Config file: ${CONFIG_FILE}`)
    console.error(`Error: ${error}`)
    console.error('')
    console.error('Please run "yarn deploy" or "bun deploy" to reconfigure.')
    console.error('========================================\n')
    process.exit(1)
  }
}
