import { Elysia, Context, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { Auth, AuthTypes } from './auth.types'

const verifyToken = async({ jwt, headers, cookie }: Context & { jwt: any }) => {
  let token = cookie.token?.value as string | undefined
  if (!token) {
    const authHeader = headers.authorization
    if (authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1]
  }
  if (!token) return undefined
  try {
    const t = await jwt.verify(token)
    return t
  } catch(e) {
    return undefined
  }
}

export const authPlugin = new Elysia({ name: 'auth-plugin' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    })
  )
  .macro({
    auth: <T extends Auth>(at: T) => ({
      resolve: async (context) => {
        const authData = await verifyToken(context) as AuthTypes[T] | undefined
        if (!authData) return context.status(401, { error: 'Unauthorized' })
        return { authData }
      }
    })
  })
