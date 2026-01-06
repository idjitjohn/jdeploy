import { t } from 'elysia'

const PathsDTO = t.Object({
  home: t.String(),
  code: t.String(),
  release: t.String(),
  certificate: t.String(),
  logs: t.String(),
  nginxAvailable: t.String(),
  nginxEnabled: t.String()
})

const ConfigurationDTO = t.Object({
  id: t.String(),
  paths: PathsDTO,
  createdAt: t.String(),
  updatedAt: t.String()
})

const GetConfigurationResDTO = t.Object({
  configuration: ConfigurationDTO
})

const UpdateConfigurationReqDTO = t.Object({
  paths: t.Partial(PathsDTO)
})

const UpdateConfigurationResDTO = t.Object({
  configuration: ConfigurationDTO
})

export const configurationDTO = {
  Paths: PathsDTO,
  Configuration: ConfigurationDTO,
  GetConfigurationRes: GetConfigurationResDTO,
  UpdateConfigurationReq: UpdateConfigurationReqDTO,
  UpdateConfigurationRes: UpdateConfigurationResDTO
}
