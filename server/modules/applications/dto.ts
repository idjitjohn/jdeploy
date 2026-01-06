import { t } from 'elysia'

const FileTransferDTO = t.Object({
  src: t.String(),
  dest: t.String(),
  op: t.Union([t.Literal('cp'), t.Literal('mv'), t.Literal('ln')])
})

const ApplicationDTO = t.Object({
  id: t.String(),
  name: t.String(),
  repoUrl: t.String(),
  template: t.String(),
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
  branch: t.String(),
  createdAt: t.String(),
  updatedAt: t.String()
})

const CreateApplicationReqDTO = t.Object({
  name: t.String({ minLength: 1 }),
  repoUrl: t.String({ minLength: 1 }),
  template: t.String(),
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
  branch: t.Optional(t.String())
})

const UpdateApplicationReqDTO = t.Object({
  name: t.String({ minLength: 1 }),
  repoUrl: t.String({ minLength: 1 }),
  template: t.String(),
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
  IdParam: IdParamDTO
} as const
