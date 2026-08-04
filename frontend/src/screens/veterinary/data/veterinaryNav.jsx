import { IconPaths } from '../../../components/icons'

export function getVeterinaryNavItems(activeKey, handlers) {
  const { onGoDashboard, onOpenLookup, onOpenInspectionHistory, onGoNotBuilt } = handlers
  return [
    { label: 'Dashboard', icon: IconPaths.grid, active: activeKey === 'dashboard', onClick: onGoDashboard },
    { label: 'Animal lookup', icon: IconPaths.search, active: activeKey === 'lookup', onClick: onOpenLookup },
    { label: 'Scheduled visits', icon: IconPaths.schedule, onClick: onGoNotBuilt },
    { label: 'Inspection history', icon: IconPaths.clock, active: activeKey === 'history', onClick: onOpenInspectionHistory },
    { label: 'Settings', icon: IconPaths.gear, onClick: onGoNotBuilt },
  ]
}