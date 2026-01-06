import { createApplicationsService } from './context'
import { Auth } from '../../plugins/auth.types'
import connectDB from '@/lib/db'
import ApplicationModel from '@/server/models/Application'
import DeploymentLogModel from '@/server/models/DeploymentLog'
import ConfigurationModel from '@/server/models/Configuration'
import { runDeployment, getLogPath, setDeploymentConfig } from '@/lib/deployment'
import fs from 'fs'
import path from 'path'

export const list = createApplicationsService(
  {
    response: 'ListApplicationsRes',
    auth: Auth.USER
  },
  async ({ authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const applications = await ApplicationModel.find().lean()

    return {
      applications: applications.map((app: any) => ({
        id: app._id.toString(),
        name: app.name,
        repoUrl: app.repoUrl,
        template: app.template,
        domain: app.domain,
        port: app.port,
        prebuild: app.prebuild || [],
        build: app.build || [],
        deployment: app.deployment || [],
        launch: app.launch || [],
        files: app.files || [],
        nginxConfig: app.nginx || '',
        env: app.env || '',
        envFilePath: app.envFilePath || '.env',
        branch: app.branch || 'main',
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString()
      }))
    }
  }
)

export const get = createApplicationsService(
  {
    params: 'IdParam',
    response: 'GetApplicationRes',
    auth: Auth.USER
  },
  async ({ params, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const application = await ApplicationModel.findById(params.id)

    if (!application) {
      set.status = 404
      throw new Error('Application not found')
    }

    return {
      application: {
        id: application._id.toString(),
        name: application.name,
        repoUrl: application.repoUrl,
        template: application.template,
        domain: application.domain,
        port: application.port,
        prebuild: application.prebuild || [],
        build: application.build || [],
        deployment: application.deployment || [],
        launch: application.launch || [],
        files: application.files || [],
        nginxConfig: application.nginx || '',
        env: application.env || '',
        envFilePath: application.envFilePath || '.env',
        branch: application.branch || 'main',
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString()
      }
    }
  }
)

export const create = createApplicationsService(
  {
    body: 'CreateApplicationReq',
    response: 'CreateApplicationRes',
    auth: Auth.ADMIN
  },
  async ({ body, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const existing = await ApplicationModel.findOne({ name: body.name })
    if (existing) {
      set.status = 409
      throw new Error('Application with this name already exists')
    }

    const application = await ApplicationModel.create({
      name: body.name,
      repoUrl: body.repoUrl,
      template: body.template,
      domain: body.domain,
      port: body.port,
      prebuild: body.prebuild || [],
      build: body.build || [],
      deployment: body.deployment || [],
      launch: body.launch || [],
      files: body.files || [],
      nginx: body.nginxConfig || '',
      env: body.env || '',
      envFilePath: body.envFilePath || '.env',
      branch: body.branch || 'main'
    })

    return {
      application: {
        id: application._id.toString(),
        name: application.name,
        repoUrl: application.repoUrl,
        template: application.template,
        domain: application.domain,
        port: application.port,
        prebuild: application.prebuild || [],
        build: application.build || [],
        deployment: application.deployment || [],
        launch: application.launch || [],
        files: application.files || [],
        nginxConfig: application.nginx || '',
        env: application.env || '',
        envFilePath: application.envFilePath || '.env',
        branch: application.branch || 'main',
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString()
      }
    }
  }
)

export const update = createApplicationsService(
  {
    params: 'IdParam',
    body: 'UpdateApplicationReq',
    response: 'UpdateApplicationRes',
    auth: Auth.ADMIN
  },
  async ({ params, body, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const application = await ApplicationModel.findByIdAndUpdate(
      params.id,
      {
        $set: {
          name: body.name,
          repoUrl: body.repoUrl,
          template: body.template,
          domain: body.domain,
          port: body.port,
          prebuild: body.prebuild || [],
          build: body.build || [],
          deployment: body.deployment || [],
          launch: body.launch || [],
          files: body.files || [],
          nginx: body.nginxConfig || '',
          env: body.env || '',
          envFilePath: body.envFilePath || '.env',
          branch: body.branch || 'main'
        }
      },
      { new: true }
    )

    if (!application) {
      set.status = 404
      throw new Error('Application not found')
    }

    return {
      application: {
        id: application._id.toString(),
        name: application.name,
        repoUrl: application.repoUrl,
        template: application.template,
        domain: application.domain,
        port: application.port,
        prebuild: application.prebuild || [],
        build: application.build || [],
        deployment: application.deployment || [],
        launch: application.launch || [],
        files: application.files || [],
        nginxConfig: application.nginx || '',
        env: application.env || '',
        envFilePath: application.envFilePath || '.env',
        branch: application.branch || 'main',
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString()
      }
    }
  }
)

export const remove = createApplicationsService(
  {
    params: 'IdParam',
    response: 'DeleteApplicationRes',
    auth: Auth.ADMIN
  },
  async ({ params, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const application = await ApplicationModel.findById(params.id)

    if (!application) {
      set.status = 404
      throw new Error('Application not found')
    }

    const appName = application.name
    const branch = application.branch || 'main'

    await ApplicationModel.findByIdAndDelete(params.id)
    await DeploymentLogModel.deleteMany({ application: appName })

    const config = await ConfigurationModel.findOne()
    const codePath = config?.paths?.code || '/var/webhooks/code'
    const releasePath = config?.paths?.release || '/var/webhooks/release'
    const logsPath = config?.paths?.logs || '/var/webhooks/logs'

    const codeAppPath = path.join(codePath, appName, branch)
    if (fs.existsSync(codeAppPath)) {
      fs.rmSync(codeAppPath, { recursive: true, force: true })
    }

    const codeAppParent = path.join(codePath, appName)
    if (fs.existsSync(codeAppParent)) {
      const files = fs.readdirSync(codeAppParent)
      if (files.length === 0) {
        fs.rmdirSync(codeAppParent)
      }
    }

    const releaseAppPath = path.join(releasePath, appName)
    if (fs.existsSync(releaseAppPath)) {
      fs.rmSync(releaseAppPath, { recursive: true, force: true })
    }

    const logsAppPath = path.join(logsPath, appName)
    if (fs.existsSync(logsAppPath)) {
      fs.rmSync(logsAppPath, { recursive: true, force: true })
    }

    return {
      message: 'Application and all associated files deleted successfully'
    }
  }
)

export const redeploy = createApplicationsService(
  {
    params: 'IdParam',
    response: 'RedeployApplicationRes',
    auth: Auth.ADMIN
  },
  async ({ params, authData, set }: any) => {
    console.log("[Redeploy] params:", params)
    await connectDB()
    const repo = await ApplicationModel.findById(params.id)

    if (!repo) {
      set.status = 404
      throw new Error('Application not found')
    }

    const config = await ConfigurationModel.findOne()
    if (config?.paths) {
      setDeploymentConfig(config.paths)
    }

    const logPath = getLogPath(repo.name)
    const branch = repo.branch || 'main'
    const env = {}

    const log = new DeploymentLogModel({
      application: repo.name,
      branch,
      type: 'manual',
      status: 'running',
      triggeredBy: authData.username,
      startedAt: new Date(),
      logFile: logPath
    })
    await log.save()

    runDeployment({
      repoName: repo.name,
      branch,
      repoUrl: repo.repoUrl,
      logPath,
      port: repo.port,
      env,
      envFileContent: repo.env || '',
      envFilePath: repo.envFilePath || '.env',
      prebuild: repo.prebuild || [],
      build: repo.build || [],
      deployment: repo.deployment || [],
      launch: repo.launch || [],
      files: repo.files || [],
      appId: repo._id.toString()
    })
      .then((result) => {
        if (result?.success) {
          DeploymentLogModel.findByIdAndUpdate(log._id, {
            status: 'success',
            completedAt: new Date(),
            exitCode: 0
          }).catch(console.error)
        } else {
          DeploymentLogModel.findByIdAndUpdate(log._id, {
            status: 'failed',
            completedAt: new Date(),
            exitCode: 1,
            errorMessage: result?.error
          }).catch(console.error)
        }
      })
      .catch((error) => {
        console.error('Background deployment error:', error)
        DeploymentLogModel.findByIdAndUpdate(log._id, {
          status: 'failed',
          completedAt: new Date(),
          exitCode: 1,
          errorMessage: error.message
        }).catch(console.error)
      })

    return {
      log: {
        id: log._id.toString(),
        application: repo.name,
        branch,
        type: 'manual',
        status: 'running',
        triggeredBy: authData.username,
        startedAt: log.startedAt.toISOString(),
        logFile: logPath
      }
    }
  }
)

export const applicationsService = {
  list,
  get,
  create,
  update,
  remove,
  redeploy
}
