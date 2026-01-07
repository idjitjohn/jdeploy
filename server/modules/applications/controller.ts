import { getApplicationsController } from './context'
import { applicationsService } from './service'

export const applicationsController = getApplicationsController
  .get('/', applicationsService.list, {
    summary: 'List applications',
    description: 'Get all applications'
  })
  .get('/:id', applicationsService.get, {
    summary: 'Get application',
    description: 'Get application by ID'
  })
  .post('/', applicationsService.create, {
    summary: 'Create application',
    description: 'Create a new application'
  })
  .put('/:id', applicationsService.update, {
    summary: 'Update application',
    description: 'Update an existing application'
  })
  .delete('/:id', applicationsService.remove, {
    summary: 'Delete application',
    description: 'Delete an application and all associated files'
  })
  .post('/:id/redeploy', applicationsService.redeploy, {
    summary: 'Redeploy application',
    description: 'Trigger a new deployment for the application'
  })
  .get('/:id/branches', applicationsService.getBranches, {
    summary: 'Get branches',
    description: 'Get all git branches for an application'
  })
  .post('/:id/branch', applicationsService.switchBranch, {
    summary: 'Switch branch',
    description: 'Switch to a different git branch and update the application'
  })
  .build()
