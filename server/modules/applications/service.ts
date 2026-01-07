import { createApplicationsService } from './context'
import { Auth } from '../../plugins/auth.types'
import connectDB from '@/lib/db'
import ApplicationModel from '@/server/models/Application'
import DeploymentLogModel from '@/server/models/DeploymentLog'
import ConfigurationModel, { IConfiguration } from '@/server/models/Configuration'
import { runDeployment, getLogPath, setDeploymentConfig, initializeApplication } from '@/lib/deployment'
import { execSync } from 'child_process'
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
        environment: app.environment || 'prod',
        branch: app.branch || 'main',
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString()
      }))
    }
  }
)

export const get = createApplicationsService(
  {
    response: 'GetApplicationRes',
    auth: Auth.USER
  },
  async ({ params, authData, set }: any) => {
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
        environment: application.environment || 'prod',
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
      environment: body.environment || 'prod',
      branch: body.branch || 'main'
    })

    // Create folders and clone repository
    const config = await ConfigurationModel.findOne()
    if (config?.home) {
      setDeploymentConfig({ home: config.home })
    }
    initializeApplication(application.name, application.repoUrl, application.branch || 'main')

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
        environment: application.environment || 'prod',
        branch: application.branch || 'main',
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString()
      }
    }
  }
)

export const update = createApplicationsService(
  {
    body: 'UpdateApplicationReq',
    response: 'UpdateApplicationRes',
    auth: Auth.ADMIN
  },
  async ({ params, body, authData, set }: any) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    // Get old values before update
    const oldApplication = await ApplicationModel.findById(params.id).lean() as any
    if (!oldApplication) {
      set.status = 404
      throw new Error('Application not found')
    }

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
          environment: body.environment || 'prod',
          branch: body.branch || 'main'
        }
      },
      { new: true }
    )

    if (!application) {
      set.status = 404
      throw new Error('Application not found')
    }

    // Rewrite env file if env values changed
    const oldEnv = oldApplication.env || ''
    const newEnv = body.env || ''
    if (newEnv && newEnv !== oldEnv) {
      const config = await ConfigurationModel.findOne().lean() as IConfiguration | null
      const home = config?.home || '/var/webhooks'
      const appCodePath = path.join(home, 'code', application.name)
      const envFilePath = body.envFilePath || '.env'
      const fullEnvPath = path.join(appCodePath, envFilePath)
      if (fs.existsSync(appCodePath)) {
        fs.writeFileSync(fullEnvPath, newEnv, 'utf-8')
      }
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
        environment: application.environment || 'prod',
        branch: application.branch || 'main',
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString()
      }
    }
  }
)

export const remove = createApplicationsService(
  {
    response: 'DeleteApplicationRes',
    auth: Auth.ADMIN
  },
  async ({ params, authData, set }: any) => {
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

    await ApplicationModel.findByIdAndDelete(params.id)
    await DeploymentLogModel.deleteMany({ application: appName })

    const config = await ConfigurationModel.findOne()
    const home = config?.home || '/var/webhooks'

    const codeAppPath = path.join(home, 'code', appName)
    if (fs.existsSync(codeAppPath)) {
      fs.rmSync(codeAppPath, { recursive: true, force: true })
    }

    const releaseAppPath = path.join(home, 'release', appName)
    if (fs.existsSync(releaseAppPath)) {
      fs.rmSync(releaseAppPath, { recursive: true, force: true })
    }

    const logsAppPath = path.join(home, 'logs', appName)
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
    response: 'RedeployApplicationRes',
    auth: Auth.ADMIN
  },
  async ({ params, authData, set }: any) => {
    await connectDB()
    const repo = await ApplicationModel.findById(params.id)

    if (!repo) {
      set.status = 404
      throw new Error('Application not found')
    }

    const config = await ConfigurationModel.findOne()
    if (config?.home) {
      setDeploymentConfig({ home: config.home })
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

export const getBranches = createApplicationsService(
  {
    params: 'IdParam',
    response: 'GetBranchesRes',
    auth: Auth.USER
  },
  async ({ params, authData, set }) => {
    if (!authData) {
      set.status = 401
      throw new Error('Unauthorized')
    }

    await connectDB()

    const application = await ApplicationModel.findById(params.id).lean() as any
    if (!application) {
      set.status = 404
      throw new Error('Application not found')
    }

    const config = await ConfigurationModel.findOne().lean() as IConfiguration | null
    const home = config?.home || '/var/webhooks'
    const appCodePath = path.join(home, 'code', application.name)

    if (!fs.existsSync(appCodePath)) {
      set.status = 400
      throw new Error('Application code directory not found. Deploy the application first.')
    }

    try {
      // Fetch latest from remote
      execSync('git fetch --all', { cwd: appCodePath, encoding: 'utf-8', stdio: 'pipe' })

      // Get all branches
      const branchOutput = execSync('git branch -a', { cwd: appCodePath, encoding: 'utf-8', stdio: 'pipe' })

      const branches = branchOutput
        .split('\n')
        .map(b => b.trim())
        .filter(b => b && !b.startsWith('*'))
        .map(b => b.replace(/^remotes\/origin\//, ''))
        .filter(b => b && !b.includes('HEAD'))
        .filter((b, i, arr) => arr.indexOf(b) === i) // unique

      return { branches }
    } catch (error: any) {
      set.status = 500
      throw new Error(`Failed to get branches: ${error.message}`)
    }
  }
)

export const switchBranch = createApplicationsService(
  {
    params: 'IdParam',
    body: 'SwitchBranchReq',
    response: 'SwitchBranchRes',
    auth: Auth.USER
  },
  async ({ params, body, authData, set }) => {
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

    const config = await ConfigurationModel.findOne().lean() as IConfiguration | null
    const home = config?.home || '/var/webhooks'
    const currentBranch = application.branch || 'main'
    const appCodePath = path.join(home, 'code', application.name)

    if (!fs.existsSync(appCodePath)) {
      set.status = 400
      throw new Error('Application code directory not found. Deploy the application first.')
    }

    const newBranch = body.branch

    try {
      // Fetch, reset and checkout new branch
      execSync(`git fetch --all`, { cwd: appCodePath, encoding: 'utf-8', stdio: 'pipe' })
      execSync(`git reset --hard origin/${currentBranch}`, { cwd: appCodePath, encoding: 'utf-8', stdio: 'pipe' })
      execSync(`git checkout ${newBranch}`, { cwd: appCodePath, encoding: 'utf-8', stdio: 'pipe' })

      // Rewrite env file to prevent versioned env conflicts
      if (application.env) {
        const envFilePath = application.envFilePath || '.env'
        const fullEnvPath = path.join(appCodePath, envFilePath)
        fs.writeFileSync(fullEnvPath, application.env, 'utf-8')
      }

      // Update application branch in database
      application.branch = newBranch
      await application.save()

      return {
        message: `Switched to branch ${newBranch}`,
        branch: newBranch
      }
    } catch (error: any) {
      set.status = 500
      throw new Error(`Failed to switch branch: ${error.message}`)
    }
  }
)

export const applicationsService = {
  list,
  get,
  create,
  update,
  remove,
  redeploy,
  getBranches,
  switchBranch
}
