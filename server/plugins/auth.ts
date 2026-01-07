import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { Auth } from './auth.types'

export const authPlugin = new Elysia({ name: 'auth-plugin' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    })
  ).macro({
    auth: <T extends Auth>(at: T) => ({
      resolve: async (context) => {
        let token = context.cookie.token?.value as string | undefined
        if (!token) {
          const authHeader = (context.headers as any)['authorization']
          if (authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1]
        }
        if (!token) return context.status(401, { error: 'Unauthorized: No token provided' })

        try {
          return {authData: await context.jwt.verify(token) }
        } catch(e) {
          console.error('Token verification failed:', e)
          return context.status(401, { error: 'Unauthorized: Invalid token' })
        }
      }
  })
})
