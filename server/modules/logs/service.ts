import { createService } from '../../utils/base'
import { logsContext } from './context'
import { Auth } from '../../plugins/auth.types'
import { connectDB } from '@/server/lib/db'
import DeploymentLog from '@/server/models/DeploymentLog'
import { getCurrentLogPath } from '@/server/lib/deployment'
import fs from 'fs/promises'
import { ObjectId, FlattenMaps } from 'mongoose'
import { DeploymentLogDocument } from '@/server/models/DeploymentLog'

type LeanDeploymentLog = FlattenMaps<DeploymentLogDocument> & { _id: ObjectId }

const createLogsService = createService(logsContext)

export const list = createLogsService(
  {
    params: 'RepoNameParam',
    response: 'ListLogsRes',
    auth: Auth.USER
  },
  async ({ params, set }) => {
    await connectDB()

    const logs = await DeploymentLog.find({ application: params.repoName })
      .sort({ createdAt: -1 })
      .lean()

    return logs.map(log => ({
      id: (log._id as ObjectId).toString(),
      application: log.application,
      status: log.status,
      logFile: log.logFile || '',
      branch: log.branch,
      type: log.type,
      triggeredBy: log.triggeredBy,
      startedAt: log.startedAt?.toISOString() || '',
      completedAt: log.completedAt?.toISOString(),
      errorMessage: log.errorMessage,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString()
    }))
  }
)

export const get = createLogsService(
  {
    params: 'LogIdParam',
    response: 'GetLogRes',
    auth: Auth.USER
  },
  async ({ params, set }) => {
    await connectDB()

    const log = await DeploymentLog.findById(params.logId).lean() as LeanDeploymentLog | null

    if (!log) {
      set.status = 404
      throw new Error('Log not found')
    }

    return {
      id: log._id.toString(),
      application: log.application,
      status: log.status,
      logFile: log.logFile || '',
      branch: log.branch,
      type: log.type,
      triggeredBy: log.triggeredBy,
      startedAt: log.startedAt?.toISOString() || '',
      completedAt: log.completedAt?.toISOString(),
      errorMessage: log.errorMessage,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString()
    }
  }
)

export const getContent = createLogsService(
  {
    params: 'LogIdParam',
    response: 'GetLogContentRes',
    auth: Auth.USER
  },
  async ({ params, set }) => {
    await connectDB()

    const log = await DeploymentLog.findById(params.logId).lean() as LeanDeploymentLog | null

    if (!log) {
      set.status = 404
      throw new Error('Log not found')
    }

    try {
      // If deployment is still running, read from current.log
      let logFilePath = log.logFile || ''
      if (log.status === 'running') {
        logFilePath = getCurrentLogPath(log.application)
      }
      const content = await fs.readFile(logFilePath, 'utf-8')
      return { content }
    } catch (error) {
      // Return empty content instead of 404 for running deployments
      if (log.status === 'running') {
        return { content: 'Waiting for deployment to start...' }
      }
      set.status = 404
      throw new Error('Log file not found')
    }
  }
)

export const clear = createLogsService(
  {
    params: 'RepoNameParam',
    response: 'ClearLogsRes',
    auth: Auth.ADMIN
  },
  async ({ params, set }) => {
    await connectDB()

    const logs = await DeploymentLog.find({ application: params.repoName })
      .sort({ createdAt: -1 })
      .lean()

    if (logs.length <= 1) {
      return {
        message: 'No logs to delete',
        deletedCount: 0
      }
    }

    const logsToDelete = logs.slice(1)

    for (const log of logsToDelete) {
      try {
        if (log.logFile) await fs.unlink(log.logFile)
      } catch (error: any) {
        // ignore ENOENT - file already deleted
        if (error.code !== 'ENOENT') {
          console.error(`Failed to delete log file: ${log.logFile}`, error)
        }
      }
    }

    const result = await DeploymentLog.deleteMany({
      _id: { $in: logsToDelete.map(l => l._id) }
    })

    return {
      message: `Deleted ${result.deletedCount} old logs`,
      deletedCount: result.deletedCount
    }
  }
)

export const logsService = {
  list,
  get,
  getContent,
  clear
}
