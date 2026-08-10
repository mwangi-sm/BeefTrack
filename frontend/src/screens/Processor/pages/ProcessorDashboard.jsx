import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../../components/DashboardShell'
import { DashHead } from '../../../components/DashHead'
import { NoteBanner, Panel, TraceabilityLookup } from '../../../components/DashboardBits'
import { IconPaths } from '../../../components/icons'
import { useProcessorData } from '../context/useProcessorData'
import { ProcessorStats } from './ProcessorStats'
import { QuickActions } from './QuickActions'
import { ProcessingQueue } from './ProcessingQueue'
import { ProcessingQueuePageContent } from './ProceesingQueuePage'
import { BatchTable } from './BatchTable'
import { PackagingQueue } from './PackagingQueue'
import { QRGeneratorPanel } from './QRGeneratorPanel'
import { ColdStoragePanel } from './ColdStoragePanel'
import { InventorySummary } from './InventorySummary'
import { QualityControlCard } from './QualityControlCard'
import { ProductionChart } from './ProductionChart'
import { NotificationPanel } from './NotificationPanel'
import { RecentActivityPanel } from './RecentActivityPanel'
import { ReceiveCarcassModal } from './ReceiveCarcassModal'
import { CreateBatchModal } from './CreateBatchModal'
import { PackageProductsModal } from './PackageProductsModal'

const navItems = [
  { label: 'Dashboard', icon: IconPaths.grid, active: true },
  { label: 'Processing queue', icon: IconPaths.route },
  { label: 'Incoming carcasses', icon: IconPaths.abattoir },
  { label: 'Batch management', icon: IconPaths.cut },
  { label: 'Packaging', icon: IconPaths.storefront },
  { label: 'QR generation', icon: IconPaths.qr },
  { label: 'Inventory', icon: IconPaths.boxes },
  { label: 'Quality control', icon: IconPaths.check },
  { label: 'Cold storage', icon: IconPaths.warehouse },
  { label: 'Reports', icon: IconPaths.sales },
  { label: 'Notifications', icon: IconPaths.bell },
  { label: 'Settings', icon: IconPaths.gear },
]

function ProcessorHome({ userName }) {
  const { notifications } = useProcessorData()
  const [isReceiveCarcassOpen, setIsReceiveCarcassOpen] = useState(false)
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false)
  const [isPackageProductsOpen, setIsPackageProductsOpen] = useState(false)

  const urgentNotifications = notifications.filter((n) => n.type === 'warning')

  return (
    <>
      <DashHead
        greeting="Welcome,"
        title={userName}
        subtitle="Cutting, packaging and labelling status across today's production."
        actions={
          <QuickActions
            onReceiveCarcass={() => setIsReceiveCarcassOpen(true)}
            onCreateBatch={() => setIsCreateBatchOpen(true)}
            onPackageProducts={() => setIsPackageProductsOpen(true)}
          />
        }
      />

      {urgentNotifications.length > 0 && (
        <NoteBanner>
          <b>{urgentNotifications.length} notification{urgentNotifications.length === 1 ? '' : 's'}</b> need your attention.
        </NoteBanner>
      )}

      <ProcessorStats />

      <div className="grid-2col">
        <div>
          <ProcessingQueue />
          <BatchTable />
          <PackagingQueue />
          <ProductionChart />
        </div>

        <div>
          <QRGeneratorPanel />
          <ColdStoragePanel />
          <InventorySummary />
          <QualityControlCard />

          <Panel title="Traceability lookup">
            <TraceabilityLookup
              helper="Look up a carcass or animal ID to see its full history before creating a batch."
              placeholder="e.g. CC-000534"
              buttonLabel="Look up record"
            />
          </Panel>

          <NotificationPanel />
          <RecentActivityPanel />
        </div>
      </div>

      <ReceiveCarcassModal
        isOpen={isReceiveCarcassOpen}
        onClose={() => setIsReceiveCarcassOpen(false)}
      />
      <CreateBatchModal
        isOpen={isCreateBatchOpen}
        onClose={() => setIsCreateBatchOpen(false)}
      />
      <PackageProductsModal
        isOpen={isPackageProductsOpen}
        onClose={() => setIsPackageProductsOpen(false)}
      />
    </>
  )
}

export function ProcessorDashboard({ onLogout, onToggleTheme, userName = 'User' }) {
  const { profile } = useProcessorData()
  const navigate = useNavigate()

  const companyName = profile?.companyName || 'Processor'
  const actorId = profile?.actorId || 'Not yet assigned'

  const wiredNavItems = navItems.map((item) =>
    item.label === 'Processing queue'
      ? { ...item, onClick: () => navigate('/dashboard/processor/queue') }
      : item
  )

  return (
    <DashboardShell
      roleLabel="PROCESSOR"
      actorId={actorId}
      name={companyName}
      navItems={wiredNavItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
    >
      <Routes>
        <Route index element={<ProcessorHome userName={userName} />} />
        <Route path="queue" element={<ProcessingQueuePageContent />} />
      </Routes>
    </DashboardShell>
  )
}
