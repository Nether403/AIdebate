import { DebateOrchestrator } from '@/components/debate'

interface DebatePageProps {
  params: {
    debateId: string
  }
}

export default function DebatePage({ params }: DebatePageProps) {
  return <DebateOrchestrator debateId={params.debateId} />
}
