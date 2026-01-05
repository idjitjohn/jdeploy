import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export type FileOperation = 'cp' | 'mv' | 'ln'

export interface FileTransfer {
  src: string
  dest: string
  op: FileOperation
}

export interface DeploymentContext {
  appId: string
  repoName: string
  branch: string
  repoUrl: string
  logPath: string
  env: Record<string, string>
  envFileContent?: string
  envFilePath?: string
  prebuild: string[]
  build: string[]
  deployment: string[]
  launch: string[]
  files: FileTransfer[]
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

export function interpolateVariables(command: string, context: { repoName: string; branch: string; port?: number, appId?: string }): string {
  const codePath = getDeploymentPath(context.repoName, context.branch)
  const releasePath = getReleasePath(context.repoName)
  const certificatePath = path.join(deploymentConfig.certificate, context.repoName)

  return command
    .replace(/\$id\$/g, context.appId || '')
    .replace(/\$cf\$/g, codePath)
    .replace(/\$rf\$/g, releasePath)
    .replace(/\$certsf\$/g, certificatePath)
    .replace(/\$logsf\$/g, path.join(deploymentConfig.logs, context.repoName))
    .replace(/\$branch\$/g, context.branch)
    .replace(/\$name\$/g, context.repoName)
    .replace(/\$repoName\$/g, context.repoName)
    .replace(/\$port\$/g, context.port?.toString() || '')
}

export function executeCommand(cmd: string, cwd: string, env?: Record<string, string>): string {
  try {
    console.log(`[executeCommand] cwd: ${cwd}, cmd: ${cmd}`)

    // Create minimal clean environment - only essential vars, let .env files load naturally
    const cleanEnv = {
      HOME: process.env.HOME || '',
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
      USER: process.env.USER || '',
    } as any

    const result = execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      env: cleanEnv,
      stdio: 'pipe',
      shell: '/bin/bash'
    })
    return result.toString()
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message
    const stdout = error.stdout?.toString() || ''
    throw new Error(`Command failed: ${cmd}\n${stdout}\n${stderr}`)
  }
}

// Run only prebuild commands in config.paths.code directory (for initial application setup)
export async function prepare(context: DeploymentContext): Promise<{
  success: boolean, output: string, error?: string
}> {
  const output: string[] = []
  const codePath = deploymentConfig.code

  console.log(`\n🔧 [${context.repoName}] Running preparation in ${codePath}`)
  try {
    output.push(`[${new Date().toISOString()}] Running prebuild for ${context.repoName}`)

    // Ensure code directory exists
    if (!fs.existsSync(codePath)) {
      fs.mkdirSync(codePath, { recursive: true })
    }

    output.push(`[${new Date().toISOString()}] Running prebuild scripts in ${codePath}...`)
    for (const script of context.prebuild) {
      const interpolated = interpolateVariables(script, { repoName: context.repoName, branch: context.branch, port: context.port, appId: context.appId })
      output.push(`> ${interpolated}`)
      console.log(`[${context.repoName}] Executing prebuild: ${interpolated}`)
      const result = executeCommand(interpolated, codePath, context.env)
      output.push(result)
    }

    output.push(`[${new Date().toISOString()}] ✅ Prebuild completed successfully`)

    const fullOutput = output.join('\n')
    fs.writeFileSync(context.logPath, fullOutput)

    console.log(`✅ [${context.repoName}] Prebuild completed successfully\n`)
    return {
      success: true,
      output: fullOutput
    }
  } catch (error: any) {
    const errorMsg = error.message
    output.push(`[${new Date().toISOString()}] ❌ Prebuild failed: ${errorMsg}`)

    const fullOutput = output.join('\n')
    fs.writeFileSync(context.logPath, fullOutput)

    console.error(`❌ [${context.repoName}] Prebuild failed: ${errorMsg}\n`)
    return {
      success: false,
      output: fullOutput,
      error: errorMsg
    }
  }
}

// Run only prebuild commands in config.paths.code directory (for initial application setup)
export async function runPrebuild(context: DeploymentContext): Promise<{
  success: boolean
  output: string
  error?: string
}> {
  const output: string[] = []
  const codePath = deploymentConfig.code

  console.log(`\n🔧 [${context.repoName}] Running prebuild in ${codePath}`)
  try {
    output.push(`[${new Date().toISOString()}] Running prebuild for ${context.repoName}`)

    // Ensure code directory exists
    if (!fs.existsSync(codePath)) {
      fs.mkdirSync(codePath, { recursive: true })
    }

    output.push(`[${new Date().toISOString()}] Running prebuild scripts in ${codePath}...`)
    for (const script of context.prebuild) {
      const interpolated = interpolateVariables(script, { repoName: context.repoName, branch: context.branch, port: context.port, appId: context.appId })
      output.push(`> ${interpolated}`)
      console.log(`[${context.repoName}] Executing prebuild: ${interpolated}`)
      const result = executeCommand(interpolated, codePath, context.env)
      output.push(result)
    }

    output.push(`[${new Date().toISOString()}] ✅ Prebuild completed successfully`)

    const fullOutput = output.join('\n')
    fs.writeFileSync(context.logPath, fullOutput)

    console.log(`✅ [${context.repoName}] Prebuild completed successfully\n`)
    return {
      success: true,
      output: fullOutput
    }
  } catch (error: any) {
    const errorMsg = error.message
    output.push(`[${new Date().toISOString()}] ❌ Prebuild failed: ${errorMsg}`)

    const fullOutput = output.join('\n')
    fs.writeFileSync(context.logPath, fullOutput)

    console.error(`❌ [${context.repoName}] Prebuild failed: ${errorMsg}\n`)
    return {
      success: false,
      output: fullOutput,
      error: errorMsg
    }
  }
}

// Full deployment: prebuild (code folder) -> build (app code folder) -> deployment (app code folder) -> launch (release folder)
export async function runDeployment(context: DeploymentContext): Promise<{
  success: boolean, output: string, error?: string
}> {
  const output: string[] = []
  const appCodePath = getDeploymentPath(context.repoName, context.branch)
  const releasePath = getReleasePath(context.repoName)

  console.log(`\n🚀 [${context.repoName}] Starting deployment for branch: ${context.branch}`)
  try {
    output.push(`[${new Date().toISOString()}] Starting deployment for ${context.repoName}/${context.branch}`)

    // Clone or update repository

    if (!fs.existsSync(appCodePath)) {
      fs.mkdirSync(appCodePath, { recursive: true })
      output.push(`[${new Date().toISOString()}] Cloning repository...`)
      const cloneCmd = `git clone --depth 1 --branch ${context.branch} ${context.repoUrl} .`
      executeCommand(cloneCmd, appCodePath, context.env)
      output.push(`✓ Repository cloned`)
    }

    // 1. Prebuild - runs in config.paths.code
    output.push(`[${new Date().toISOString()}] Running prebuild scripts in ${appCodePath}...`)
    const result = executeCommand("which yarn", appCodePath, context.env)
    console.log("Ito za zao:", {result})

    for (const script of context.prebuild) {
      const interpolated = interpolateVariables(script, { repoName: context.repoName, branch: context.branch, port: context.port, appId: context.appId })
      output.push(`> ${interpolated}`)
      console.log(`[${context.repoName}] Executing prebuild in code folder: ${interpolated}`)
      const result = executeCommand(interpolated, appCodePath, context.env)
      output.push(result)
    }

    // Write env file to app code folder
    if (context.envFileContent) {
      const envFilePath = context.envFilePath || '.env'
      const fullEnvPath = path.join(appCodePath, envFilePath)
      output.push(`[${new Date().toISOString()}] Creating environment file: ${envFilePath}`)
      fs.writeFileSync(fullEnvPath, context.envFileContent, 'utf-8')
      output.push(`✓ Environment file created at ${envFilePath}`)
      console.log(`[${context.repoName}] Environment file created: ${fullEnvPath}`)
    }

    // Create release folder before build commands
    if (!fs.existsSync(releasePath)) {
      output.push(`[${new Date().toISOString()}] Creating release folder...`)
      fs.mkdirSync(releasePath, { recursive: true })
      output.push(`✓ Release folder created at ${releasePath}`)
      console.log(`[${context.repoName}] Release folder created: ${releasePath}`)
    } else {
      output.push(`[${new Date().toISOString()}] Release folder already exists`)
    }

    // 2. Build - runs in application code folder
    output.push(`[${new Date().toISOString()}] Running build commands in ${appCodePath}...`)
    for (const cmd of context.build) {
      const interpolated = interpolateVariables(cmd, { repoName: context.repoName, branch: context.branch, port: context.port, appId: context.appId })
      output.push(`> ${interpolated}`)
      console.log(`[${context.repoName}] Executing build in app code folder: ${interpolated}`)
      const result = executeCommand(interpolated, appCodePath, context.env)
      output.push(result)
    }

    // 2.5. File transfers - copy/move/symlink files after build
    if (context.files && context.files.length > 0) {
      output.push(`[${new Date().toISOString()}] Processing file transfers...`)
      for (const file of context.files) {
        const srcPath = interpolateVariables(file.src, { repoName: context.repoName, branch: context.branch, port: context.port, appId: context.appId })
        const destPath = interpolateVariables(file.dest, { repoName: context.repoName, branch: context.branch, port: context.port, appId: context.appId })
        let cmd: string
        switch (file.op) {
          case 'mv':
            cmd = `mv -f ${srcPath} ${destPath}`
            break
          case 'ln':
            cmd = `ln -sf ${srcPath} ${destPath}`
            break
          case 'cp':
          default:
            cmd = `cp -rf ${srcPath} ${destPath}`
            break
        }
        output.push(`> ${cmd}`)
        console.log(`[${context.repoName}] File transfer: ${cmd}`)
        const result = executeCommand(cmd, appCodePath, context.env)
        output.push(result)
      }
      output.push(`✓ File transfers completed`)
    }

    // 3. Deployment - runs in application code folder
    output.push(`[${new Date().toISOString()}] Running deployment commands in ${appCodePath}...`)
    for (const cmd of context.deployment) {
      const interpolated = interpolateVariables(cmd, { repoName: context.repoName, branch: context.branch, port: context.port, appId: context.appId })
      output.push(`> ${interpolated}`)
      console.log(`[${context.repoName}] Executing deployment in app code folder: ${interpolated}`)
      const result = executeCommand(interpolated, appCodePath, context.env)
      output.push(result)
    }

    // 4. Launch - runs in release folder
    output.push(`[${new Date().toISOString()}] Running launch commands in ${releasePath}...`)
    for (const script of context.launch) {
      const interpolated = interpolateVariables(script, { repoName: context.repoName, branch: context.branch, port: context.port, appId: context.appId })
      output.push(`> ${interpolated}`)
      console.log(`[${context.repoName}] Executing launch in release folder: ${interpolated}`)
      const result = executeCommand(interpolated, releasePath, context.env)
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
