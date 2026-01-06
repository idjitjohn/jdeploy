import { t } from 'elysia'

const DomainDTO = t.Object({
  id: t.String(),
  name: t.String(),
  certificate: t.Optional(t.String()),
  privateKey: t.Optional(t.String()),
  createdAt: t.String(),
  updatedAt: t.String()
})

const CreateDomainReqDTO = t.Object({
  name: t.String({ minLength: 1 }),
  certificate: t.Optional(t.String()),
  privateKey: t.Optional(t.String())
})

const UpdateDomainReqDTO = t.Object({
  name: t.String({ minLength: 1 }),
  certificate: t.Optional(t.String()),
  privateKey: t.Optional(t.String())
})

const ListDomainsResDTO = t.Object({
  domains: t.Array(DomainDTO)
})

const GetDomainResDTO = t.Object({
  domain: DomainDTO
})

const CreateDomainResDTO = t.Object({
  domain: DomainDTO
})

const UpdateDomainResDTO = t.Object({
  domain: DomainDTO
})

const DeleteDomainResDTO = t.Object({
  message: t.String()
})

const IdParamDTO = t.Object({
  id: t.String()
})

export const domainsModels = {
  Domain: DomainDTO,
  CreateDomainReq: CreateDomainReqDTO,
  UpdateDomainReq: UpdateDomainReqDTO,
  ListDomainsRes: ListDomainsResDTO,
  GetDomainRes: GetDomainResDTO,
  CreateDomainRes: CreateDomainResDTO,
  UpdateDomainRes: UpdateDomainResDTO,
  DeleteDomainRes: DeleteDomainResDTO,
  IdParam: IdParamDTO
} as const
