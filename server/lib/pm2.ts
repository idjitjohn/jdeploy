import { execSync } from 'child_process'

export interface PM2Process {
  name: string
  pid: number
  status: 'online' | 'stopped' | 'stopping' | 'deleted' | string
  uptime: number
  restarts: number
  memory: number
  cpu: number
}

export function isPM2Installed(): boolean {
  try {
    execSync('pm2 --version', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export function getProcessList(): PM2Process[] {
  try {
    const output = execSync('pm2 list --no-colors --quiet', {
      encoding: 'utf-8',
      stdio: 'pipe'
    })

    const processes: PM2Process[] = []
    const lines = output.split('\n').filter(line => line.trim())

    for (const line of lines) {
      const match = line.match(/(\S+)\s+\d+\s+(\w+)\s+/)
      if (match) {
        processes.push({
          name: match[1],
          pid: 0,
          status: match[2] as any,
          uptime: 0,
          restarts: 0,
          memory: 0,
          cpu: 0
        })
      }
    }

    return processes
  } catch {
    return []
  }
}

export function startProcess(name: string, script: string, options?: Record<string, any>): boolean {
  try {
    const opts = options || {}
    const args = [
      `pm2 start ${script}`,
      `--name ${name}`,
      opts.instances ? `--instances ${opts.instances}` : '',
      opts.exec_mode ? `--exec-mode ${opts.exec_mode}` : '',
      opts.env ? `--env ${JSON.stringify(opts.env).replace(/"/g, '\\"')}` : ''
    ].filter(Boolean).join(' ')

    execSync(args, { stdio: 'inherit' })
    return true
  } catch {
    return false
  }
}

export function stopProcess(name: string): boolean {
  try {
    execSync(`pm2 stop ${name}`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export function restartProcess(name: string): boolean {
  try {
    execSync(`pm2 restart ${name}`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export function reloadProcess(name: string): boolean {
  try {
    execSync(`pm2 reload ${name}`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export function deleteProcess(name: string): boolean {
  try {
    execSync(`pm2 delete ${name}`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export function savePM2(): boolean {
  try {
    execSync('pm2 save', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}
