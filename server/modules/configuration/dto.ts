import { t } from 'elysia'

const ConfigurationDTO = t.Object({
  id: t.String(),
  home: t.String(),
  createdAt: t.String(),
  updatedAt: t.String()
})

const GetConfigurationResDTO = t.Object({
  configuration: ConfigurationDTO
})

const UpdateConfigurationReqDTO = t.Object({
  home: t.String()
})

const UpdateConfigurationResDTO = t.Object({
  configuration: ConfigurationDTO
})

export const configurationDTO = {
  Configuration: ConfigurationDTO,
  GetConfigurationRes: GetConfigurationResDTO,
  UpdateConfigurationReq: UpdateConfigurationReqDTO,
  UpdateConfigurationRes: UpdateConfigurationResDTO
}
