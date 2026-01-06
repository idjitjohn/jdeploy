import { t } from 'elysia'

const LoginReqDTO = t.Object({
  username: t.String({ minLength: 3, maxLength: 50 }),
  password: t.String({ minLength: 6 })
})

const LoginResDTO = t.Object({
  user: t.Object({
    id: t.String(),
    username: t.String(),
    role: t.Union([t.Literal('admin'), t.Literal('user')])
  }),
  token: t.String()
})

const MeResDTO = t.Object({
  user: t.Object({
    id: t.String(),
    username: t.String(),
    email: t.String(),
    role: t.Union([t.Literal('admin'), t.Literal('user')]),
    lastLogin: t.Optional(t.String())
  })
})

const LogoutResDTO = t.Object({
  message: t.String()
})

export const authModels = {
  LoginReq: LoginReqDTO,
  LoginRes: LoginResDTO,
  MeRes: MeResDTO,
  LogoutRes: LogoutResDTO
} as const
