import './RepositoryList.scss'
import Grid from '../Grid'
import RepositoryCard from '../RepositoryCard'

interface Repository {
  id: string | number
  name: string
  url: string
  branch: string
  template: string
  domain?: string
  port?: number
  status: 'running' | 'stopped' | 'error'
  lastDeployment?: string
}

interface Props {
  repositories: Repository[]
  onDeploy?: (id: string | number) => void
  onEdit?: (id: string | number) => void
  onDelete?: (id: string | number) => void
  loading?: boolean
  columns?: number
  className?: string
}

export default function RepositoryList({
  repositories,
  onDeploy,
  onEdit,
  onDelete,
  loading = false,
  columns = 2,
  className = ''
}: Props) {
  return (
    <div className={`RepositoryList ${className}`}>
      {loading ? (
        <div className="empty">Loading repositories...</div>
      ) : repositories.length === 0 ? (
        <div className="empty">No repositories found</div>
      ) : (
        <Grid columns={columns}>
          {repositories.map((repo) => (
            <RepositoryCard
              key={repo.id}
              name={repo.name}
              url={repo.url}
              branch={repo.branch}
              template={repo.template}
              domain={repo.domain}
              port={repo.port}
              status={repo.status}
              lastDeployment={repo.lastDeployment}
              onDeploy={() => onDeploy?.(repo.id)}
              onEdit={() => onEdit?.(repo.id)}
              onDelete={() => onDelete?.(repo.id)}
            />
          ))}
        </Grid>
      )}
    </div>
  )
}
