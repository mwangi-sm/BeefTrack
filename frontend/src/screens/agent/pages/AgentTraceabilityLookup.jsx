import { TraceabilityHistoryPage, TraceabilityLookupPage } from '../../../components/TraceabilityLookupPage'
import { getAgentNavItems } from '../data/agentNav'

export function AgentTraceabilityLookup({ onGoHome, onLookup, onSeeHistory }) {
  const navItems = getAgentNavItems('', { onGoHome })
  return (
    <TraceabilityLookupPage
      roleLabel="AGENT"
      actorId="AG-000123"
      name="Samuel Otieno"
      navItems={navItems}
      onGoHome={onGoHome}
      onLookup={onLookup}
      onSeeHistory={onSeeHistory}
    />
  )
}

export function AgentTraceabilityHistory({ onGoHome, history, onBack }) {
  const navItems = getAgentNavItems('', { onGoHome })
  return (
    <TraceabilityHistoryPage
      roleLabel="AGENT"
      actorId="AG-000123"
      name="Samuel Otieno"
      navItems={navItems}
      onGoHome={onGoHome}
      history={history}
      onBack={onBack}
    />
  )
}
