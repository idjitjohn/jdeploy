import { getTemplatesController } from './context'
import { templatesService } from './service'

export const templatesController = getTemplatesController
  .get('/', templatesService.list, {
    summary: 'List templates',
    description: 'Get all templates'
  })
  .get('/:id', templatesService.get, {
    summary: 'Get template',
    description: 'Get template by ID'
  })
  .post('/', templatesService.create, {
    summary: 'Create template',
    description: 'Create a new template'
  })
  .put('/:id', templatesService.update, {
    summary: 'Update template',
    description: 'Update an existing template'
  })
  .delete('/:id', templatesService.remove, {
    summary: 'Delete template',
    description: 'Delete a template'
  })
  .build()
