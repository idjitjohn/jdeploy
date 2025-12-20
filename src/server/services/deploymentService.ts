import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import RepositoryModel from '../models/repository'
import ConfigurationModel from '../models/configuration'
import DeploymentLogModel from '../models/deploymentlog'
import { interpolateVariables, getDeploymentVariables } from '../utils/interpolation'
import { Document } from 'mongoose'

interface DeploymentLogDocument extends Document {
    repository: string
    branch: string
    type: string
    status: 'pending' | 'running' | 'success' | 'failed'
    triggeredBy: string
    webhookPayload?: any
    logFile?: string
    completedAt?: Date
    errorMessage?: string
    exitCode?: number
}

export const executeDeployment = async (
    repoName: string,
    branch: string,
    triggeredBy = 'system',
    webhookPayload: any = null
): Promise<string> => {
    const deploymentLog: DeploymentLogDocument = await DeploymentLogModel.create({
        repository: repoName,
        branch,
        type: webhookPayload ? 'webhook' : 'manual',
        status: 'pending',
        triggeredBy,
        webhookPayload,
    })

    try {
        const repo = await RepositoryModel.findOne({ name: repoName })
        if (!repo) {
            throw new Error(`RepositoryModel "${repoName}" not found`)
        }

        const branchConfig = repo.branches.get(branch)
        if (!branchConfig) {
            throw new Error(`Branch "${branch}" not found in repository "${repoName}"`)
        }

        const pathsConfig = await ConfigurationModel.findOne({ key: 'paths' })
        if (!pathsConfig) {
            throw new Error('Paths configuration not found')
        }

        const paths = pathsConfig.value
        const variables = getDeploymentVariables(repo, branch, branchConfig, paths)

        const codeFolder = variables.cf
        const releaseFolder = variables.rf

        if (!fs.existsSync(codeFolder)) {
            fs.mkdirSync(codeFolder, { recursive: true })
        }

        if (!fs.existsSync(releaseFolder)) {
            fs.mkdirSync(releaseFolder, { recursive: true })
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_')
        const logDir = path.join(process.env.HOME || '/tmp', 'deploy-logs')

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true })
        }

        const logFile = path.join(logDir, `${repoName}-${branch}-${timestamp}.log`)
        const logStream = fs.createWriteStream(logFile, { flags: 'a' })

        const log = (msg: string) => {
            const timestampStr = new Date().toISOString()
            const logLine = `[${timestampStr}] ${msg}\n`
            logStream.write(logLine)
            console.log(msg)
        }

        deploymentLog.status = 'running'
        deploymentLog.logFile = logFile
        await deploymentLog.save()

        log(`=== Starting deployment for ${repoName}:${branch} ===`)
        log(`Code folder: ${codeFolder}`)
        log(`Release folder: ${releaseFolder}`)
        log(`Branch type: ${branchConfig.type}`)
        log(`PM2 name: ${branchConfig.pm2Name}`)

        const runCommandList = (commands: string[], phase: string) => {
            if (!commands || commands.length === 0) {
                return
            }

            log(`\n${phase}...`)

            commands.forEach((cmd) => {
                const interpolated = interpolateVariables(cmd, variables)
                log(`Running: ${interpolated}`)

                try {
                    execSync(interpolated, {
                        cwd: codeFolder,
                        stdio: 'inherit',
                        shell: '/bin/bash',
                    })
                } catch (err) {
                    throw new Error(`Command failed: ${interpolated}`)
                }
            })
        }

        const beforeCommands = [
            ...(repo.preDeploy || []),
            ...(branchConfig.preDeploy || []),
        ]

        const mainCommands = repo.commands || []

        const afterCommands = [
            ...(repo.postDeploy || []),
            ...(branchConfig.postDeploy || []),
        ]

        runCommandList(beforeCommands, 'Before-deploy')
        runCommandList(mainCommands, 'Deployment')
        runCommandList(afterCommands, 'After-deploy')

        log('\n=== Deployment completed successfully ===')
        logStream.end()

        deploymentLog.status = 'success'
        deploymentLog.completedAt = new Date()
        deploymentLog.exitCode = 0
        await deploymentLog.save()

        return deploymentLog._id.toString()
    } catch (error: any) {
        deploymentLog.status = 'failed'
        deploymentLog.completedAt = new Date()
        deploymentLog.errorMessage = error.message
        deploymentLog.exitCode = 1
        await deploymentLog.save()

        throw error
    }
}

interface GetDeploymentLogsOptions {
    branch?: string
    status?: string
    limit?: number
    offset?: number
}

export const getDeploymentLogs = async (
    repoName: string,
    options: GetDeploymentLogsOptions = {}
): Promise<{ logs: DeploymentLogDocument[]; total: number }> => {
    const query: any = { repository: repoName }

    if (options.branch) {
        query.branch = options.branch
    }

    if (options.status) {
        query.status = options.status
    }

    const limit = options.limit || 50
    const offset = options.offset || 0

    const logs = await DeploymentLogModel.find(query)
        .sort({ startedAt: -1 })
        .skip(offset)
        .limit(limit)

    const total = await DeploymentLogModel.countDocuments(query)

    return { logs, total }
}

export const getDeploymentLogById = async (logId: string): Promise<{ log: DeploymentLogDocument; content: string }> => {
    const log: DeploymentLogDocument | null = await DeploymentLogModel.findById(logId)

    if (!log) {
        throw new Error('Deployment log not found')
    }

    let content = ''
    if (log.logFile && fs.existsSync(log.logFile)) {
        content = fs.readFileSync(log.logFile, 'utf-8')
    }

    return { log, content }
}
