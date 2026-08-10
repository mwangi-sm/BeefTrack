import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../../components/DashboardShell'
import { IconPaths } from '../../../components/icons'
import { useProcessorData } from '../context/useProcessorData'

export function ProcessorShell({ onLogout, onToggleTheme, children }) {
  const navigate = useNavigate()
  const { profile } = useProcessorData()

  const companyName = profile?.companyName || 'User'
  const actorId = profile?.actorId || 'Not yet assigned'

  // Only Dashboard and Processing queue have real destinations right now —
  // the rest point back at the dashboard (same treatment Distributor gave
  // Delivery tracking before its own screen existed), except Notifications
  // and Settings, which stay true no-ops until dedicated screens exist.
  const navItems = [
    {
      label: 'Dashboard',
      icon: IconPaths.grid,
      onClick: () => navigate('/dashboard/processor'),
    },
    {
      label: 'Processing queue',
      icon: IconPaths.route,
      onClick: () => navigate('/dashboard/processor/processing-queue'),
    },
    {
      label: 'Incoming carcasses',
      icon: IconPaths.abattoir,
      onClick: () => navigate('/dashboard/processor/processing-queue'),
    },
    {
      label: 'Batch management',
      icon: IconPaths.cut,
      onClick: () => navigate('/dashboard/processor'),
    },
    {
      label: 'Packaging',
      icon: IconPaths.storefront,
      onClick: () => navigate('/dashboard/processor'),
    },
    {
      label: 'QR generation',
      icon: IconPaths.qr,
      onClick: () => navigate('/dashboard/processor'),
    },
    {
      label: 'Inventory',
      icon: IconPaths.boxes,
      onClick: () => navigate('/dashboard/processor'),
    },
    {
      label: 'Quality control',
      icon: IconPaths.check,
      onClick: () => navigate('/dashboard/processor'),
    },
    {
      label: 'Cold storage',
      icon: IconPaths.warehouse,
      onClick: () => navigate('/dashboard/processor'),
    },
    {
      label: 'Reports',
      icon: IconPaths.sales,
      onClick: () => {},
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
      roleLabel="PROCESSOR"
      actorId={actorId}
      name={companyName}
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      onProfileClick={() => navigate('/dashboard/processor')}
    >
      {children}
    </DashboardShell>
  )
}