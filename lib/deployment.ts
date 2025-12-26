import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export interface DeploymentContext {
  repoName: string
  branch: string
  repoUrl: string
  logPath: string
  env: Record<string, string>
  envFileContent?: string
  envFilePath?: string
  commands: string[]
  preDeploy: string[]
  postDeploy: string[]
  port?: number
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

export function getReleasePath(repoName: string): string {
  return path.join(deploymentConfig.release, repoName)
}

export function interpolateVariables(command: string, context: { repoName: string; branch: string; port?: number }): string {
  const codePath = getDeploymentPath(context.repoName, context.branch)
  const releasePath = getReleasePath(context.repoName)
  const certificatePath = path.join(deploymentConfig.certificate, context.repoName)

  return command
    .replace(/\$cf\$/g, codePath)
    .replace(/\$rf\$/g, releasePath)
    .replace(/\$certsf\$/g, certificatePath)
    .replace(/\$logsf\$/g, path.join(deploymentConfig.logs, context.repoName))
    .replace(/\$branch\$/g, context.branch)
    .replace(/\$repoName\$/g, context.repoName)
    .replace(/\$port\$/g, context.port?.toString() || '')
}

export function executeCommand(cmd: string, cwd: string, env?: Record<string, string>): string {
  try {
    const result = execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      env: {
        ...process.env,
        ...env,
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
      },
      stdio: 'pipe',
      shell: '/bin/bash'
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

  console.log(`\n🚀 [${context.repoName}] Starting deployment for branch: ${context.branch}`)
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
      const interpolated = interpolateVariables(script, { repoName: context.repoName, branch: context.branch, port: context.port })
      output.push(`> ${interpolated}`)
      console.log(`[${context.repoName}] Executing pre-deploy: ${interpolated}`)
      const result = executeCommand(interpolated, deployPath, context.env)
      output.push(result)
    }

    if (context.envFileContent) {
      const envFilePath = path.join(deployPath, context.envFilePath || '.env')
      output.push(`[${new Date().toISOString()}] Creating/updating environment file: ${context.envFilePath || '.env'}`)
      fs.writeFileSync(envFilePath, context.envFileContent, 'utf-8')
      output.push(`✓ Environment file created/updated`)
      console.log(`[${context.repoName}] Environment file created: ${envFilePath}`)
    }

    output.push(`[${new Date().toISOString()}] Running deployment commands...`)
    for (const cmd of context.commands) {
      const interpolated = interpolateVariables(cmd, { repoName: context.repoName, branch: context.branch, port: context.port })
      output.push(`> ${interpolated}`)
      console.log(`[${context.repoName}] Executing command: ${interpolated}`)
      const result = executeCommand(interpolated, deployPath, context.env)
      output.push(result)
    }

    output.push(`[${new Date().toISOString()}] Running post-deploy scripts...`)
    for (const script of context.postDeploy) {
      const interpolated = interpolateVariables(script, { repoName: context.repoName, branch: context.branch, port: context.port })
      output.push(`> ${interpolated}`)
      console.log(`[${context.repoName}] Executing post-deploy: ${interpolated}`)
      const result = executeCommand(interpolated, deployPath, context.env)
      output.push(result)
    }

    output.push(`[${new Date().toISOString()}] ✅ Deployment completed successfully`)

    const fullOutput = output.join('\n')
    fs.writeFileSync(context.logPath, fullOutput)

    console.log(`✅ [${context.repoName}] Deployment completed successfully\n`)
    return {
      success: true,
      output: fullOutput
    }
  } catch (error: any) {
    const errorMsg = error.message
    output.push(`[${new Date().toISOString()}] ❌ Deployment failed: ${errorMsg}`)

    const fullOutput = output.join('\n')
    fs.writeFileSync(context.logPath, fullOutput)

    console.error(`❌ [${context.repoName}] Deployment failed: ${errorMsg}\n`)
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
