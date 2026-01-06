import { Elysia } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { applicationsModels } from './dto'
import { createService, createController } from '../../utils/base'

export const _applicationsContext = new Elysia({ name: 'applications-context', prefix: '/applications' })
  .use(authPlugin)
  .model(applicationsModels)

export const createApplicationsService = createService(_applicationsContext)
export const getApplicationsController = createController(_applicationsContext, ['Applications'])
