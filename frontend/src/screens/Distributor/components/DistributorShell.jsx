import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../../components/DashboardShell'
import { IconPaths } from '../../../components/icons'
import { useDistributorData } from '../context/useDistributorData'

export function DistributorShell({ onLogout, onToggleTheme, children }) {
  const navigate = useNavigate()
  const { profile } = useDistributorData()

  const distributorName = profile?.company?.distributorName || 'User'
  const distributorActorId = profile?.warehouse?.code || 'Not yet assigned'

  const navItems = [
    {
      label: 'Dashboard',
      icon: IconPaths.grid,
      onClick: () => navigate('/dashboard/distributor'),
    },
    {
      label: 'Incoming shipments',
      icon: IconPaths.warehouse,
      onClick: () => navigate('/dashboard/distributor/receive-shipment'),
    },
    {
      label: 'Warehouse inventory',
      icon: IconPaths.boxes,
      onClick: () => navigate('/dashboard/distributor/warehouse-inventory'),
    },
    {
      label: 'Delivery scheduling',
      icon: IconPaths.schedule,
      onClick: () => navigate('/dashboard/distributor/schedule-delivery'),
    },
    {
      label: 'Delivery tracking',
      icon: IconPaths.warehouse,
      onClick: () => navigate('/dashboard/distributor/schedule-delivery'),
    },
    {
      label: 'Notifications',
      icon: IconPaths.bell,
      onClick: () => {},
    },
    {
      label: 'Settings',
      icon: IconPaths.gear,
      onClick: () => {},
    },
  ]

  return (
    <DashboardShell
      roleLabel="DISTRIBUTOR"
      actorId={distributorActorId}
      name={distributorName}
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      onProfileClick={() => navigate('/dashboard/distributor/profile')}
      onNotificationsToggle={() => {}}
    >
      {children}
    </DashboardShell>
  )
}
