import { Elysia } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { logsDTO } from './dto'

export const logsContext = new Elysia({ name: 'logs-context', prefix: '/logs' })
  .use(authPlugin)
  .model(logsDTO)
