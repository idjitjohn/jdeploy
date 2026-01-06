import { createService } from '../../utils/base'
import { configurationContext } from './context'
import { Auth } from '../../plugins/auth.types'
import { connectDB } from '@/lib/db'
import Configuration from '@/server/models/Configuration'

const createConfigurationService = createService(configurationContext)

export const get = createConfigurationService(
  {
    response: 'GetConfigurationRes',
    auth: Auth.USER
  },
  async ({ set }) => {
    await connectDB()

    let configuration = await Configuration.findOne().lean()

    if (!configuration) {
      configuration = await Configuration.create({
        paths: {
          home: '/var/webhooks',
          code: '/var/webhooks/code',
          release: '/var/webhooks/release',
          certificate: '/var/webhooks/certificate',
          logs: '/var/webhooks/logs',
          nginxAvailable: '/etc/nginx/sites-available',
          nginxEnabled: '/etc/nginx/sites-enabled'
        }
      })
    }

    return {
      configuration: {
        id: configuration._id.toString(),
        paths: configuration.paths,
        createdAt: configuration.createdAt.toISOString(),
        updatedAt: configuration.updatedAt.toISOString()
      }
    }
  }
)

export const update = createConfigurationService(
  {
    body: 'UpdateConfigurationReq',
    response: 'UpdateConfigurationRes',
    auth: Auth.ADMIN
  },
  async ({ body, set }) => {
    if (!body.paths || Object.keys(body.paths).length === 0) {
      set.status = 400
      throw new Error('Missing paths configuration')
    }

    await connectDB()

    let configuration = await Configuration.findOne()

    if (!configuration) {
      configuration = await Configuration.create({
        paths: {
          home: body.paths.home || '/var/webhooks',
          code: body.paths.code || '/var/webhooks/code',
          release: body.paths.release || '/var/webhooks/release',
          certificate: body.paths.certificate || '/var/webhooks/certificate',
          logs: body.paths.logs || '/var/webhooks/logs',
          nginxAvailable: body.paths.nginxAvailable || '/etc/nginx/sites-available',
          nginxEnabled: body.paths.nginxEnabled || '/etc/nginx/sites-enabled'
        }
      })
    } else {
      configuration.paths = {
        ...configuration.paths,
        ...body.paths
      }
      await configuration.save()
    }

    return {
      configuration: {
        id: configuration._id.toString(),
        paths: configuration.paths,
        createdAt: configuration.createdAt.toISOString(),
        updatedAt: configuration.updatedAt.toISOString()
      }
    }
  }
)

export const configurationService = {
  get,
  update
}
