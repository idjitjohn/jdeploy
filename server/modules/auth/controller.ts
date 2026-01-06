import { getAuthController } from './context'
import { authService } from './service'

export const authController = getAuthController
  .post('/login', authService.login, {
    summary: 'Login',
    description: 'Authenticate user and return JWT token'
  })
  .get('/me', authService.me, {
    summary: 'Get current user',
    description: 'Get authenticated user information'
  })
  .post('/logout', authService.logout, {
    summary: 'Logout',
    description: 'Clear authentication session'
  })
  .build()
