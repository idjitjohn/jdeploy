import { Elysia } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { systemDTO } from './dto'

export const systemContext = new Elysia({ name: 'system-context', prefix: '/system' })
  .use(authPlugin)
  .model(systemDTO)
