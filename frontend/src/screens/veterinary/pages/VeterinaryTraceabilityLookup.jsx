import { TraceabilityHistoryPage, TraceabilityLookupPage } from '../../../components/TraceabilityLookupPage'
import { getVeterinaryNavItems } from '../data/veterinaryNav'

export function VeterinaryTraceabilityLookup({ onGoHome, onLookup, onSeeHistory }) {
  const navItems = getVeterinaryNavItems('', { onGoDashboard: onGoHome, onOpenLookup: () => {}, onOpenInspectionHistory: () => {}, onGoNotBuilt: () => {} })
  return (
    <TraceabilityLookupPage
      roleLabel="VETERINARY"
      actorId="VT-000102"
      name="Dr. Achieng Otieno"
      navItems={navItems}
      onGoHome={onGoHome}
      onLookup={onLookup}
      onSeeHistory={onSeeHistory}
    />
  )
}

export function VeterinaryTraceabilityHistory({ onGoHome, history, onBack }) {
  const navItems = getVeterinaryNavItems('', { onGoDashboard: onGoHome, onOpenLookup: onBack, onOpenInspectionHistory: () => {}, onGoNotBuilt: () => {} })
  return (
    <TraceabilityHistoryPage
      roleLabel="VETERINARY"
      actorId="VT-000102"
      name="Dr. Achieng Otieno"
      navItems={navItems}
      onGoHome={onGoHome}
      history={history}
      onBack={onBack}
    />
  )
}