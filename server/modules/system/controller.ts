import { createController } from '../../utils/base'
import { systemContext } from './context'
import { systemService } from './service'

const getSystemController = createController(systemContext, ['System'])

export const systemController = getSystemController
  .get('/status', systemService.status, {
    summary: 'Get system status',
    description: 'Get current system status and uptime'
  })
  .get('/pm2', systemService.pm2, {
    summary: 'Get PM2 processes',
    description: 'Get list of PM2 processes'
  })
  .post('/nginx/reload', systemService.nginxReload, {
    summary: 'Reload nginx',
    description: 'Reload nginx configuration'
  })
  .post('/nginx/test', systemService.nginxTest, {
    summary: 'Test nginx config',
    description: 'Test nginx configuration validity'
  })
  .post('/sudo/authenticate', systemService.sudoAuth, {
    summary: 'Authenticate sudo',
    description: 'Authenticate sudo password'
  })
  .build()
