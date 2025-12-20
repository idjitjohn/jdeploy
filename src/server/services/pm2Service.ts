import { execSync } from 'child_process'

interface PM2Process {
  name: string
  status: string
  pid: number
  cpu: number
  memory: number
  uptime: number
  restarts: number
}

interface PM2Env {
  status: string
  pm_uptime: number
  restart_time: number
}

interface PM2Monit {
  cpu: number
  memory: number
}

interface PM2JlistProcess {
  name: string
  pid: number
  pm2_env: PM2Env
  monit: PM2Monit
}

export const getPM2Status = (pm2Name: string): PM2Process | null => {
  try {
    const pm2List = execSync('pm2 jlist', { encoding: 'utf-8' })
    const processes: PM2JlistProcess[] = JSON.parse(pm2List)

    const process = processes.find(p => p.name === pm2Name)

    if (process) {
      return {
        name: process.name,
        status: process.pm2_env.status,
        pid: process.pid,
        cpu: process.monit.cpu,
        memory: process.monit.memory,
        uptime: process.pm2_env.pm_uptime,
        restarts: process.pm2_env.restart_time,
      }
    }

    return null
  } catch (error) {
    return null
  }
}

export const getAllPM2Processes = (): PM2Process[] => {
  try {
    const pm2List = execSync('pm2 jlist', { encoding: 'utf-8' })
    const processes: PM2JlistProcess[] = JSON.parse(pm2List)

    return processes.map(p => ({
      name: p.name,
      status: p.pm2_env.status,
      pid: p.pid,
      cpu: p.monit.cpu,
      memory: p.monit.memory,
      uptime: p.pm2_env.pm_uptime,
      restarts: p.pm2_env.restart_time,
    }))
  } catch (error) {
    return []
  }
}

export const startPM2 = (name: string, command: string): boolean => {
  try {
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (error: any) {
    throw new Error(`Failed to start PM2 process: ${error.message}`)
  }
}

export const stopPM2 = (name: string): boolean => {
  try {
    execSync(`pm2 stop ${name}`, { stdio: 'inherit' })
    return true
  } catch (error: any) {
    throw new Error(`Failed to stop PM2 process: ${error.message}`)
  }
}

export const restartPM2 = (name: string): boolean => {
  try {
    execSync(`pm2 restart ${name}`, { stdio: 'inherit' })
    return true
  } catch (error: any) {
    throw new Error(`Failed to restart PM2 process: ${error.message}`)
  }
}

export const reloadPM2 = (name: string): boolean => {
  try {
    execSync(`pm2 reload ${name}`, { stdio: 'inherit' })
    return true
  } catch (error: any) {
    throw new Error(`Failed to reload PM2 process: ${error.message}`)
  }
}

export const deletePM2 = (name: string): boolean => {
  try {
    execSync(`pm2 delete ${name}`, { stdio: 'inherit' })
    return true
  } catch (error: any) {
    throw new Error(`Failed to delete PM2 process: ${error.message}`)
  }
}
