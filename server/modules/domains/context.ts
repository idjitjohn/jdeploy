import { Elysia } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { domainsModels } from './dto'
import { createService, createController } from '../../utils/base'

export const _domainsContext = new Elysia({ name: 'domains-context', prefix: '/domains' })
  .use(authPlugin)
  .model(domainsModels)

export const createDomainsService = createService(_domainsContext)
export const getDomainsController = createController(_domainsContext, ['Domains'])
