import { Elysia } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { configurationDTO } from './dto'

export const configurationContext = new Elysia({ name: 'configuration-context', prefix: '/configuration' })
  .use(authPlugin)
  .model(configurationDTO)
