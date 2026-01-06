import { Elysia } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { templatesModels } from './dto'
import { createService, createController } from '../../utils/base'

export const _templatesContext = new Elysia({ name: 'templates-context', prefix: '/templates' })
  .use(authPlugin)
  .model(templatesModels)

export const createTemplatesService = createService(_templatesContext)
export const getTemplatesController = createController(_templatesContext, ['Templates'])
