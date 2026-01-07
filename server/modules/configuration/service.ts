import { createService } from '../../utils/base'
import { configurationContext } from './context'
import { Auth } from '../../plugins/auth.types'
import { connectDB } from '@/server/lib/db'
import Configuration, { IConfiguration } from '@/server/models/Configuration'

const createConfigurationService = createService(configurationContext)

export const get = createConfigurationService(
  {
    response: 'GetConfigurationRes',
    auth: Auth.USER
  },
  async () => {
    await connectDB()

    let configuration = await Configuration.findOne().lean() as IConfiguration | null

    if (!configuration) {
      const created = await Configuration.create({ home: '/var/webhooks' })
      configuration = created.toObject() as IConfiguration
    }

    return {
      configuration: {
        id: configuration._id.toString(),
        home: configuration.home,
        createdAt: configuration.createdAt!.toISOString(),
        updatedAt: configuration.updatedAt!.toISOString()
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
    if (!body.home) {
      set.status = 400
      throw new Error('Missing home path')
    }

    await connectDB()

    let configuration = await Configuration.findOne()

    if (!configuration) {
      configuration = await Configuration.create({
        home: body.home
      })
    } else {
      configuration.home = body.home
      await configuration.save()
    }

    return {
      configuration: {
        id: configuration._id.toString(),
        home: configuration.home,
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
