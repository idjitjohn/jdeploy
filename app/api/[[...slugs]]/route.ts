import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { authController } from '@/server/modules/auth/controller'
import { applicationsController } from '@/server/modules/applications/controller'
import { domainsController } from '@/server/modules/domains/controller'
import { templatesController } from '@/server/modules/templates/controller'
import { logsController } from '@/server/modules/logs/controller'
import { systemController } from '@/server/modules/system/controller'
import { configurationController } from '@/server/modules/configuration/controller'

const app = new Elysia({ prefix: '/api' })
  .onRequest(({ request }) => {
    console.log('[Request]', request.method, request.url)
  })
  .use(
    swagger({
      path: '/api/docs',
      documentation: {
        info: {
          title: 'Webhook Deployment API',
          version: '1.0.0',
          description: 'API for managing webhook deployments'
        }
      }
    })
  )
  .use(authController)
  .use(applicationsController)
  .use(domainsController)
  .use(templatesController)
  .use(logsController)
  .use(systemController)
  .use(configurationController)
  .onError(({ code, error, set }) => {
    console.error('[API Error]', code, error)
    
    if (code === 'VALIDATION') {
      set.status = 400
      return { error: 'Validation error', details: String(error) }
    }
    
    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Not found' }
    }
    
    set.status = 500
    return { error: error instanceof Error ? error.message : 'Internal server error' }
  })

export const GET = app.handle
export const POST = app.handle
export const PUT = app.handle
export const PATCH = app.handle
export const DELETE = app.handle
