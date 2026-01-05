import ApplicationDetail from '@/containers/ApplicationDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params
  return <ApplicationDetail id={id} />
}
