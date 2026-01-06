import { t } from 'elysia'

const StatusResDTO = t.Object({
  status: t.Literal('online'),
  uptime: t.Number(),
  timestamp: t.String(),
  environment: t.String()
})

const PM2ProcessDTO = t.Object({
  name: t.String(),
  status: t.String(),
  pid: t.Optional(t.Number()),
  cpu: t.Optional(t.Number()),
  memory: t.Optional(t.Number())
})

const PM2ResDTO = t.Object({
  processes: t.Array(PM2ProcessDTO),
  installed: t.Boolean(),
  count: t.Number(),
  message: t.Optional(t.String())
})

const NginxReloadResDTO = t.Object({
  success: t.Boolean(),
  message: t.String()
})

const NginxTestResDTO = t.Object({
  success: t.Boolean(),
  message: t.String()
})

const SudoAuthReqDTO = t.Object({
  password: t.String({ minLength: 1 })
})

const SudoAuthResDTO = t.Object({
  authenticated: t.Boolean(),
  message: t.String()
})

export const systemDTO = {
  StatusRes: StatusResDTO,
  PM2Process: PM2ProcessDTO,
  PM2Res: PM2ResDTO,
  NginxReloadRes: NginxReloadResDTO,
  NginxTestRes: NginxTestResDTO,
  SudoAuthReq: SudoAuthReqDTO,
  SudoAuthRes: SudoAuthResDTO
}
