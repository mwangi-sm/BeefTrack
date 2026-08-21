import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../../components/DashboardShell'
import { IconPaths } from '../../../components/icons'
import { useProcessorData } from '../context/useProcessorData'

export function ProcessorShell({ onLogout, onToggleTheme, userName = 'User', children }) {
  const navigate = useNavigate()
  const { profile } = useProcessorData()

  // profile.companyName is only ever set via context's setProfile(), which
  // nothing currently calls (Processor has no ProfileSetupWizard yet, unlike
  // DistributorShell -> profile.company.distributorName). Until that wizard
  // exists, fall back to the signup-derived userName so the sidebar shows
  // the name the user actually entered, instead of a hardcoded placeholder.
  const companyName = profile?.companyName || userName
  const actorId = profile?.actorId || 'Not yet assigned'

  const navItems = [
    {
      label: 'Dashboard',
      icon: IconPaths.grid,
      onClick: () => navigate('/dashboard/processor'),
    },
    {
      label: 'Processing queue',
      icon: IconPaths.route,
      onClick: () => navigate('/dashboard/processor/queue'),
    },
    {
      label: 'In processing',
      icon: IconPaths.abattoir,
      onClick: () => navigate('/dashboard/processor/queue#in-processing-section'),
    },
    {
      label: 'Batch management',
      icon: IconPaths.cut,
      onClick: () => navigate('/dashboard/processor/batches'),
    },
    {
      label: 'Packaging',
      icon: IconPaths.storefront,
      onClick: () => navigate('/dashboard/processor/packaging'),
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
      onClick: () => navigate('/dashboard/processor/cold-storage'),
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