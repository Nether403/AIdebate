import { DebateOrchestrator } from '@/components/debate'

interface DebatePageProps {
  params: Promise<{
    debateId: string
  }>
}

export default async function DebatePage({ params }: DebatePageProps) {
  const { debateId } = await params
  return <DebateOrchestrator debateId={debateId} />
}
