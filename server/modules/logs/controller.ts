import { createController } from '../../utils/base'
import { logsContext } from './context'
import { logsService } from './service'

const getLogsController = createController(logsContext, ['Logs'])

export const logsController = getLogsController
  .get('/deployment/:logId/content', logsService.getContent, {
    summary: 'Get log content',
    description: 'Get deployment log file content'
  })
  .get('/deployment/:logId', logsService.get, {
    summary: 'Get log',
    description: 'Get deployment log by ID'
  })
  .get('/app/:repoName', logsService.list, {
    summary: 'List logs',
    description: 'Get all deployment logs for an application'
  })
  .delete('/app/:repoName', logsService.clear, {
    summary: 'Clear logs',
    description: 'Delete old deployment logs (keep only latest)'
  })
  .build()
