import { IconPaths } from '../../../components/icons'

// activeKey: 'dashboard' | anything else (no item highlighted)
export function getAgentNavItems(activeKey, handlers) {
  const { onGoHome, onGoNotBuilt } = handlers

  return [
    { label: 'Dashboard', icon: IconPaths.grid, active: activeKey === 'dashboard', onClick: onGoHome },
    { label: 'Inventory', icon: IconPaths.book, onClick: onGoNotBuilt },
    { label: 'Dispatch to transporter', icon: IconPaths.truck, onClick: onGoNotBuilt },
    { label: 'Sales & transactions', icon: IconPaths.sales, onClick: onGoNotBuilt },
    { label: 'Settings', icon: IconPaths.gear, onClick: onGoNotBuilt },
  ]
}
