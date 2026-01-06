import { Elysia } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { authModels } from './dto'
import { createService, createController } from '../../utils/base'

export const _authContext = new Elysia({ name: 'auth-context', prefix: '/auth' })
  .use(authPlugin)
  .model(authModels)

export const createAuthService = createService(_authContext)
export const getAuthController = createController(_authContext, ['Auth'])
