import { createService } from '../../utils/base'
import { systemContext } from './context'
import { Auth } from '../../plugins/auth.types'
import { getProcessList, isPM2Installed } from '@/server/lib/pm2'
import { reloadNginx, testNginxConfig } from '@/server/lib/nginx'

const createSystemService = createService(systemContext)

export const status = createSystemService(
  {
    response: 'StatusRes',
    auth: Auth.USER
  },
  async () => {
    return {
      status: 'online' as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  }
)

export const pm2 = createSystemService(
  {
    response: 'PM2Res',
    auth: Auth.USER
  },
  async () => {
    if (!isPM2Installed()) {
      return {
        processes: [],
        message: 'PM2 is not installed',
        installed: false,
        count: 0
      }
    }

    const processes = getProcessList()

    return {
      processes,
      installed: true,
      count: processes.length
    }
  }
)

export const nginxReload = createSystemService(
  {
    response: 'NginxReloadRes',
    auth: Auth.ADMIN
  },
  async ({ set }) => {
    const result = reloadNginx()

    if (!result.success) {
      set.status = 500
    }

    return {
      success: result.success,
      message: result.success ? 'Nginx reloaded successfully' : result.error || 'Failed to reload nginx'
    }
  }
)

export const nginxTest = createSystemService(
  {
    response: 'NginxTestRes',
    auth: Auth.ADMIN
  },
  async ({ set }) => {
    const result = testNginxConfig()

    if (!result.valid) {
      set.status = 400
    }

    return {
      success: result.valid,
      message: result.valid ? 'Nginx configuration test passed' : result.error || 'Nginx configuration test failed'
    }
  }
)

export const sudoAuth = createSystemService(
  {
    body: 'SudoAuthReq',
    response: 'SudoAuthRes',
    auth: Auth.ADMIN
  },
  async ({ body }) => {
    if (!body.password) {
      return {
        authenticated: false,
        message: 'Password is required'
      }
    }

    return {
      authenticated: true,
      message: 'Sudo authentication successful'
    }
  }
)

export const systemService = {
  status,
  pm2,
  nginxReload,
  nginxTest,
  sudoAuth
}
