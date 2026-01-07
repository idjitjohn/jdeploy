import { t } from 'elysia'

const FileTransferDTO = t.Object({
  src: t.String(),
  dest: t.String(),
  op: t.Union([t.Literal('cp'), t.Literal('mv'), t.Literal('ln'), t.Literal('rm')])
})

const TemplateDTO = t.Object({
  id: t.String(),
  name: t.String(),
  displayName: t.String(),
  description: t.String(),
  prebuild: t.Array(t.String()),
  build: t.Array(t.String()),
  deployment: t.Array(t.String()),
  launch: t.Array(t.String()),
  files: t.Array(FileTransferDTO),
  nginxConfig: t.String(),
  env: t.String(),
  createdAt: t.String(),
  updatedAt: t.String()
})

const CreateTemplateReqDTO = t.Object({
  name: t.String({ minLength: 1 }),
  displayName: t.String({ minLength: 1 }),
  description: t.String({ minLength: 1 }),
  prebuild: t.Optional(t.Array(t.String())),
  build: t.Optional(t.Array(t.String())),
  deployment: t.Optional(t.Array(t.String())),
  launch: t.Optional(t.Array(t.String())),
  files: t.Optional(t.Array(FileTransferDTO)),
  nginxConfig: t.Optional(t.String()),
  env: t.Optional(t.String())
})

const UpdateTemplateReqDTO = t.Object({
  name: t.String({ minLength: 1 }),
  displayName: t.String({ minLength: 1 }),
  description: t.String({ minLength: 1 }),
  prebuild: t.Optional(t.Array(t.String())),
  build: t.Optional(t.Array(t.String())),
  deployment: t.Optional(t.Array(t.String())),
  launch: t.Optional(t.Array(t.String())),
  files: t.Optional(t.Array(FileTransferDTO)),
  nginxConfig: t.Optional(t.String()),
  env: t.Optional(t.String())
})

const ListTemplatesResDTO = t.Object({
  templates: t.Array(TemplateDTO)
})

const GetTemplateResDTO = t.Object({
  template: TemplateDTO
})

const CreateTemplateResDTO = t.Object({
  template: TemplateDTO
})

const UpdateTemplateResDTO = t.Object({
  template: TemplateDTO
})

const DeleteTemplateResDTO = t.Object({
  message: t.String()
})

const IdParamDTO = t.Object({
  id: t.String()
})

export const templatesModels = {
  FileTransfer: FileTransferDTO,
  Template: TemplateDTO,
  CreateTemplateReq: CreateTemplateReqDTO,
  UpdateTemplateReq: UpdateTemplateReqDTO,
  ListTemplatesRes: ListTemplatesResDTO,
  GetTemplateRes: GetTemplateResDTO,
  CreateTemplateRes: CreateTemplateResDTO,
  UpdateTemplateRes: UpdateTemplateResDTO,
  DeleteTemplateRes: DeleteTemplateResDTO,
  IdParam: IdParamDTO
} as const
