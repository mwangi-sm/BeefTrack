import { TraceabilityHistoryPage, TraceabilityLookupPage } from '../../../components/TraceabilityLookupPage'
import { getFarmerNavItems } from '../data/farmerNav'

export function FarmerTraceabilityLookup({ onGoHome, onLookup, onSeeHistory }) {
  const navItems = getFarmerNavItems('', { onGoHome })
  return (
    <TraceabilityLookupPage
      roleLabel="FARMER"
      actorId="F-2026-0001"
      name="Wanjiku Mwangi"
      navItems={navItems}
      onGoHome={onGoHome}
      onLookup={onLookup}
      onSeeHistory={onSeeHistory}
    />
  )
}

export function FarmerTraceabilityHistory({ onGoHome, history, onBack }) {
  const navItems = getFarmerNavItems('', { onGoHome })
  return (
    <TraceabilityHistoryPage
      roleLabel="FARMER"
      actorId="F-2026-0001"
      name="Wanjiku Mwangi"
      navItems={navItems}
      onGoHome={onGoHome}
      history={history}
      onBack={onBack}
    />
  )
}