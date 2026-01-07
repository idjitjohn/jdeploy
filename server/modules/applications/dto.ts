import { t } from 'elysia'

const FileTransferDTO = t.Object({
  src: t.String(),
  dest: t.String(),
  op: t.Union([t.Literal('cp'), t.Literal('mv'), t.Literal('ln'), t.Literal('rm')])
})

const ApplicationDTO = t.Object({
  id: t.String(),
  name: t.String(),
  repoUrl: t.String(),
  template: t.String(),
  subdomain: t.String(),
  domain: t.String(),
  port: t.Number(),
  prebuild: t.Array(t.String()),
  build: t.Array(t.String()),
  deployment: t.Array(t.String()),
  launch: t.Array(t.String()),
  files: t.Array(FileTransferDTO),
  nginxConfig: t.String(),
  env: t.String(),
  envFilePath: t.String(),
  environment: t.Union([t.Literal('dev'), t.Literal('prod'), t.Literal('stag'), t.Literal('test')]),
  branch: t.String(),
  createdAt: t.String(),
  updatedAt: t.String()
})

const CreateApplicationReqDTO = t.Object({
  name: t.String({ minLength: 1 }),
  repoUrl: t.String({ minLength: 1 }),
  template: t.String(),
  subdomain: t.Optional(t.String({ pattern: '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' })),
  domain: t.String({ minLength: 1 }),
  port: t.Number({ minimum: 1, maximum: 65535 }),
  prebuild: t.Optional(t.Array(t.String())),
  build: t.Optional(t.Array(t.String())),
  deployment: t.Optional(t.Array(t.String())),
  launch: t.Optional(t.Array(t.String())),
  files: t.Optional(t.Array(FileTransferDTO)),
  nginxConfig: t.Optional(t.String()),
  env: t.Optional(t.String()),
  envFilePath: t.Optional(t.String()),
  environment: t.Optional(t.Union([t.Literal('dev'), t.Literal('prod'), t.Literal('stag'), t.Literal('test')])),
  branch: t.Optional(t.String())
})

const UpdateApplicationReqDTO = t.Object({
  name: t.String({ minLength: 1 }),
  repoUrl: t.String({ minLength: 1 }),
  template: t.String(),
  subdomain: t.Optional(t.String({ pattern: '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' })),
  domain: t.String({ minLength: 1 }),
  port: t.Number({ minimum: 1, maximum: 65535 }),
  prebuild: t.Optional(t.Array(t.String())),
  build: t.Optional(t.Array(t.String())),
  deployment: t.Optional(t.Array(t.String())),
  launch: t.Optional(t.Array(t.String())),
  files: t.Optional(t.Array(FileTransferDTO)),
  nginxConfig: t.Optional(t.String()),
  env: t.Optional(t.String()),
  envFilePath: t.Optional(t.String()),
  environment: t.Optional(t.Union([t.Literal('dev'), t.Literal('prod'), t.Literal('stag'), t.Literal('test')])),
  branch: t.Optional(t.String())
})

const ListApplicationsResDTO = t.Object({
  applications: t.Array(ApplicationDTO)
})

const GetApplicationResDTO = t.Object({
  application: ApplicationDTO
})

const CreateApplicationResDTO = t.Object({
  application: ApplicationDTO
})

const UpdateApplicationResDTO = t.Object({
  application: ApplicationDTO
})

const DeleteApplicationResDTO = t.Object({
  message: t.String()
})

const RedeployApplicationResDTO = t.Object({
  log: t.Object({
    id: t.String(),
    application: t.String(),
    branch: t.String(),
    type: t.String(),
    status: t.String(),
    triggeredBy: t.String(),
    startedAt: t.String(),
    logFile: t.String()
  })
})

const IdParamDTO = t.Object({
  id: t.String()
}, { additionalProperties: true })

const GetBranchesResDTO = t.Object({
  branches: t.Array(t.String())
})

const SwitchBranchReqDTO = t.Object({
  branch: t.String({ minLength: 1 })
})

const SwitchBranchResDTO = t.Object({
  message: t.String(),
  branch: t.String()
})

const CheckNameReqDTO = t.Object({
  name: t.String({ minLength: 1 }),
  excludeId: t.Optional(t.String())
})

const CheckNameResDTO = t.Object({
  available: t.Boolean(),
  message: t.Optional(t.String())
})

const CheckSubdomainReqDTO = t.Object({
  subdomain: t.String(),
  domain: t.String({ minLength: 1 }),
  excludeId: t.Optional(t.String())
})

const CheckSubdomainResDTO = t.Object({
  available: t.Boolean(),
  message: t.Optional(t.String())
})

const CheckPortReqDTO = t.Object({
  port: t.Number({ minimum: 1, maximum: 65535 }),
  excludeId: t.Optional(t.String())
})

const CheckPortResDTO = t.Object({
  available: t.Boolean(),
  message: t.Optional(t.String())
})

export const applicationsModels = {
  FileTransfer: FileTransferDTO,
  Application: ApplicationDTO,
  CreateApplicationReq: CreateApplicationReqDTO,
  UpdateApplicationReq: UpdateApplicationReqDTO,
  ListApplicationsRes: ListApplicationsResDTO,
  GetApplicationRes: GetApplicationResDTO,
  CreateApplicationRes: CreateApplicationResDTO,
  UpdateApplicationRes: UpdateApplicationResDTO,
  DeleteApplicationRes: DeleteApplicationResDTO,
  RedeployApplicationRes: RedeployApplicationResDTO,
  GetBranchesRes: GetBranchesResDTO,
  SwitchBranchReq: SwitchBranchReqDTO,
  SwitchBranchRes: SwitchBranchResDTO,
  IdParam: IdParamDTO,
  CheckNameReq: CheckNameReqDTO,
  CheckNameRes: CheckNameResDTO,
  CheckSubdomainReq: CheckSubdomainReqDTO,
  CheckSubdomainRes: CheckSubdomainResDTO,
  CheckPortReq: CheckPortReqDTO,
  CheckPortRes: CheckPortResDTO
} as const
