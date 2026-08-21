import { Routes, Route, useNavigate } from 'react-router-dom'
import { VeterinaryDashboard } from './VeterinaryDashboard'
import AnimalLookup from './AnimalLookup'
import { VeterinaryTraceabilityHistory, VeterinaryTraceabilityLookup } from './VeterinaryTraceabilityLookup'
import LogVisit from './LogVisit'
import { InspectionHistory } from './InspectionHistory'

export function VeterinaryRoutes({ flow, fullname, onLogout, onToggleTheme, traceabilityHistory, onRecordTraceabilityLookup }) {
  const navigate = useNavigate()
  const goDashboard = () => navigate('/veterinary')
  const goLookup = () => navigate('/veterinary/lookup')
  const goTraceability = () => navigate('/veterinary/traceability')
  const goTraceabilityHistory = () => navigate('/veterinary/traceability/history')
  const goLogVisit = () => navigate('/veterinary/log-visit')
  const goInspectionHistory = () => navigate('/veterinary/inspection-history')
  const common = { fullname: `Dr. ${fullname}`, onLogout, onToggleTheme, farms: flow.farms, animals: flow.animals }
  return <Routes>
    <Route index element={<VeterinaryDashboard {...common} onRecordInspection={flow.handleRecordInspection} onOpenLookup={goLookup} onOpenTraceability={goTraceability} onOpenLogVisit={goLogVisit} onOpenInspectionHistory={goInspectionHistory} />} />
    <Route path="lookup" element={<AnimalLookup {...common} onOpenDashboard={goDashboard} />} />
    <Route path="traceability" element={<VeterinaryTraceabilityLookup onGoHome={goDashboard} onLookup={onRecordTraceabilityLookup} onSeeHistory={goTraceabilityHistory} />} />
    <Route path="traceability/history" element={<VeterinaryTraceabilityHistory onGoHome={goDashboard} history={traceabilityHistory} onBack={goTraceability} />} />
    <Route path="log-visit" element={<LogVisit {...common} onSave={flow.handleSaveVeterinaryVisit} onCancel={goDashboard} onOpenLookup={goLookup} onOpenInspectionHistory={goInspectionHistory} />} />
    <Route path="inspection-history" element={<InspectionHistory {...common} onBack={goDashboard} onOpenLookup={goLookup} />} />
  </Routes>
}