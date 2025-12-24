import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export interface DeploymentContext {
  repoName: string
  branch: string
  repoUrl: string
  logPath: string
  env: Record<string, string>
  commands: string[]
  preDeploy: string[]
  postDeploy: string[]
}

export interface DeploymentConfig {
  home: string
  code: string
  release: string
  certificate: string
  logs: string
  nginxAvailable: string
  nginxEnabled: string
}

let deploymentConfig: DeploymentConfig = {
  home: '/var/webhooks',
  code: '/var/webhooks/code',
  release: '/var/webhooks/release',
  certificate: '/var/webhooks/certificate',
  logs: '/var/webhooks/logs',
  nginxAvailable: '/etc/nginx/sites-available',
  nginxEnabled: '/etc/nginx/sites-enabled'
}

export function setDeploymentConfig(config: DeploymentConfig) {
  deploymentConfig = config
}

export function getDeploymentPath(repoName: string, branch: string): string {
  return path.join(deploymentConfig.code, repoName, branch)
}

export function getLogPath(repoName: string): string {
  const logsDir = path.join(deploymentConfig.logs, repoName)
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }
  return path.join(logsDir, `${Date.now()}.log`)
}

export function executeCommand(cmd: string, cwd: string, env?: Record<string, string>): string {
  try {
    const result = execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      stdio: 'pipe'
    })
    return result
  } catch (error: any) {
    throw new Error(`Command failed: ${cmd}\n${error.message}`)
  }
}

export async function runDeployment(context: DeploymentContext): Promise<{
  success: boolean
  output: string
  error?: string
}> {
  const output: string[] = []
  const deployPath = getDeploymentPath(context.repoName, context.branch)

  try {
    output.push(`[${new Date().toISOString()}] Starting deployment for ${context.repoName}/${context.branch}`)

    if (!fs.existsSync(deployPath)) {
      fs.mkdirSync(deployPath, { recursive: true })
      output.push(`[${new Date().toISOString()}] Cloning repository...`)
      const cloneCmd = `git clone --depth 1 --branch ${context.branch} ${context.repoUrl} .`
      executeCommand(cloneCmd, deployPath, context.env)
      output.push(`✓ Repository cloned`)
    } else {
      output.push(`[${new Date().toISOString()}] Pulling latest changes...`)
      executeCommand('git fetch origin', deployPath)
      executeCommand(`git reset --hard origin/${context.branch}`, deployPath)
      output.push(`✓ Repository updated`)
    }

    output.push(`[${new Date().toISOString()}] Running pre-deploy scripts...`)
    for (const script of context.preDeploy) {
      output.push(`> ${script}`)
      const result = executeCommand(script, deployPath, context.env)
      output.push(result)
    }

    output.push(`[${new Date().toISOString()}] Running deployment commands...`)
    for (const cmd of context.commands) {
      output.push(`> ${cmd}`)
      const result = executeCommand(cmd, deployPath, context.env)
      output.push(result)
    }

    output.push(`[${new Date().toISOString()}] Running post-deploy scripts...`)
    for (const script of context.postDeploy) {
      output.push(`> ${script}`)
      const result = executeCommand(script, deployPath, context.env)
      output.push(result)
    }

    output.push(`[${new Date().toISOString()}] ✅ Deployment completed successfully`)

    const fullOutput = output.join('\n')
    fs.writeFileSync(context.logPath, fullOutput)

    return {
      success: true,
      output: fullOutput
    }
  } catch (error: any) {
    const errorMsg = error.message
    output.push(`[${new Date().toISOString()}] ❌ Deployment failed: ${errorMsg}`)

    const fullOutput = output.join('\n')
    fs.writeFileSync(context.logPath, fullOutput)

    return {
      success: false,
      output: fullOutput,
      error: errorMsg
    }
  }
}

export function cleanupDeployment(repoName: string, branch: string): void {
  const deployPath = getDeploymentPath(repoName, branch)
  if (fs.existsSync(deployPath)) {
    fs.rmSync(deployPath, { recursive: true })
  }
}
