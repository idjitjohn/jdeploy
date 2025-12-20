const { execSync } = require('child_process')

const getPM2Status = (pm2Name) => {
  try {
    const pm2List = execSync('pm2 jlist', { encoding: 'utf-8' })
    const processes = JSON.parse(pm2List)

    const process = processes.find(p => p.name === pm2Name)

    if (process) {
      return {
        name: process.name,
        status: process.pm2_env.status,
        pid: process.pid,
        cpu: process.monit.cpu,
        memory: process.monit.memory,
        uptime: process.pm2_env.pm_uptime,
        restarts: process.pm2_env.restart_time
      }
    }

    return null
  } catch (error) {
    return null
  }
}

const getAllPM2Processes = () => {
  try {
    const pm2List = execSync('pm2 jlist', { encoding: 'utf-8' })
    const processes = JSON.parse(pm2List)

    return processes.map(p => ({
      name: p.name,
      status: p.pm2_env.status,
      pid: p.pid,
      cpu: p.monit.cpu,
      memory: p.monit.memory,
      uptime: p.pm2_env.pm_uptime,
      restarts: p.pm2_env.restart_time
    }))
  } catch (error) {
    return []
  }
}

const startPM2 = (name, command) => {
  try {
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (error) {
    throw new Error(`Failed to start PM2 process: ${error.message}`)
  }
}

const stopPM2 = (name) => {
  try {
    execSync(`pm2 stop ${name}`, { stdio: 'inherit' })
    return true
  } catch (error) {
    throw new Error(`Failed to stop PM2 process: ${error.message}`)
  }
}

const restartPM2 = (name) => {
  try {
    execSync(`pm2 restart ${name}`, { stdio: 'inherit' })
    return true
  } catch (error) {
    throw new Error(`Failed to restart PM2 process: ${error.message}`)
  }
}

const reloadPM2 = (name) => {
  try {
    execSync(`pm2 reload ${name}`, { stdio: 'inherit' })
    return true
  } catch (error) {
    throw new Error(`Failed to reload PM2 process: ${error.message}`)
  }
}

const deletePM2 = (name) => {
  try {
    execSync(`pm2 delete ${name}`, { stdio: 'inherit' })
    return true
  } catch (error) {
    throw new Error(`Failed to delete PM2 process: ${error.message}`)
  }
}

module.exports = {
  getPM2Status,
  getAllPM2Processes,
  startPM2,
  stopPM2,
  restartPM2,
  reloadPM2,
  deletePM2
}
