import { createController } from '../../utils/base'
import { configurationContext } from './context'
import { configurationService } from './service'

const getConfigurationController = createController(configurationContext, ['Configuration'])

export const configurationController = getConfigurationController
  .get('/', configurationService.get, {
    summary: 'Get configuration',
    description: 'Get system configuration'
  })
  .put('/', configurationService.update, {
    summary: 'Update configuration',
    description: 'Update system configuration'
  })
  .build()
