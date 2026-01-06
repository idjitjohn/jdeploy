import { getDomainsController } from './context'
import { domainsService } from './service'

export const domainsController = getDomainsController
  .get('/', domainsService.list, {
    summary: 'List domains',
    description: 'Get all domains'
  })
  .get('/:id', domainsService.get, {
    summary: 'Get domain',
    description: 'Get domain by ID'
  })
  .post('/', domainsService.create, {
    summary: 'Create domain',
    description: 'Create a new domain'
  })
  .put('/:id', domainsService.update, {
    summary: 'Update domain',
    description: 'Update an existing domain'
  })
  .delete('/:id', domainsService.remove, {
    summary: 'Delete domain',
    description: 'Delete a domain'
  })
  .build()
