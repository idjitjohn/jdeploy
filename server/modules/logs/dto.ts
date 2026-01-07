import { t } from 'elysia'

const LogDTO = t.Object({
  id: t.String(),
  application: t.String(),
  status: t.Union([
    t.Literal('pending'),
    t.Literal('running'),
    t.Literal('success'),
    t.Literal('failed')
  ]),
  logFile: t.Optional(t.String()),
  branch: t.String(),
  type: t.Union([
    t.Literal('webhook'),
    t.Literal('manual'),
    t.Literal('cli'),
    t.Literal('initial')
  ]),
  triggeredBy: t.String(),
  startedAt: t.Optional(t.String()),
  completedAt: t.Optional(t.String()),
  errorMessage: t.Optional(t.String()),
  createdAt: t.String(),
  updatedAt: t.String()
})

const ListLogsResDTO = t.Array(LogDTO)

const GetLogResDTO = LogDTO

const GetLogContentResDTO = t.Object({
  content: t.String()
})

const ClearLogsResDTO = t.Object({
  message: t.String(),
  deletedCount: t.Number()
})

const RepoNameParamDTO = t.Object({
  repoName: t.String()
})

const LogIdParamDTO = t.Object({
  logId: t.String()
})

export const logsDTO = {
  Log: LogDTO,
  ListLogsRes: ListLogsResDTO,
  GetLogRes: GetLogResDTO,
  GetLogContentRes: GetLogContentResDTO,
  ClearLogsRes: ClearLogsResDTO,
  RepoNameParam: RepoNameParamDTO,
  LogIdParam: LogIdParamDTO
}
