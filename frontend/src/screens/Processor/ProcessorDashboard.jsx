import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/DashboardShell'
import { DashHead } from '../../components/DashHead'
import { NoteBanner, Panel, TraceabilityLookup } from '../../components/DashboardBits'
import { IconPaths } from '../../components/icons'
import { useProcessorData } from './context/useProcessorData'
import { ProcessorStats } from './pages/ProcessorStats'
import { QuickActions } from './pages/QuickActions'
import { ProcessingQueue } from './pages/ProcessingQueue'
import { BatchTable } from './pages/BatchTable'
import { PackagingQueue } from './pages/PackagingQueue'
import { QRGeneratorPanel } from './pages/QRGeneratorPanel'
import { ColdStoragePanel } from './pages/ColdStoragePanel'
import { InventorySummary } from './pages/InventorySummary'
import { QualityControlCard } from './pages/QualityControlCard'
import { ProductionChart } from './pages/ProductionChart'
import { NotificationPanel } from './pages/NotificationPanel'
import { RecentActivityPanel } from './pages/RecentActivityPanel'
import { ReceiveCarcassModal } from './pages/ReceiveCarcassModal'
import { CreateBatchModal } from './pages/CreateBatchModal'
import { PackageProductsModal } from './pages/PackageProductsModal'

// Reorganized per the proposed layout doc, using the real IconPaths set.
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

export function ProcessorDashboard({ onLogout, onToggleTheme }) {
  const navigate = useNavigate()
  const { profile, notifications } = useProcessorData()
  const [isReceiveCarcassOpen, setIsReceiveCarcassOpen] = useState(false)
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false)
  const [isPackageProductsOpen, setIsPackageProductsOpen] = useState(false)

  // Falls back to placeholder values until the profile setup flow (mirroring
  // Distributor's ProfileSetupWizard) exists for Processor and populates
  // context.profile — same "no hardcoded company name/ID" cleanup pattern.
  const companyName = profile.companyName || 'Processor'
  const actorId = profile.actorId || 'Not yet assigned'

  const urgentNotifications = notifications.filter((n) => n.type === 'warning')

  return (
    <DashboardShell
      roleLabel="PROCESSOR"
      actorId={actorId}
      name={companyName}
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      onProfileClick={() => navigate('/dashboard/processor')}
      onNotificationsToggle={() => {}}
    >
      <DashHead
        greeting="Welcome!"
        title={companyName}
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

      <style>{`
        .stat-grid-8 {
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 900px) {
          .stat-grid-8 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .stat-grid-8 { grid-template-columns: 1fr; }
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.82rem;
        }

        .empty-state {
          color: var(--pq-text-muted, #5a6570);
          font-size: 0.9rem;
          margin: 6px 0;
        }

        .pq-table {
          --pq-border: var(--border-color, #dfe4ea);
          --pq-surface-muted: var(--surface-muted, #f6f8fa);
          --pq-text-muted: var(--text-muted, #5a6570);
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }

        .pq-table th,
        .pq-table td {
          text-align: left;
          padding: 9px 10px;
          border-bottom: 1px solid var(--pq-border);
        }

        .pq-table th {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--pq-text-muted);
        }

        .pq-table tbody tr:hover {
          background: var(--pq-surface-muted);
        }

        .pq-status {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 600;
          border: 1px solid transparent;
        }

        .pq-status-ready {
          background: var(--accent-color-soft, #e4f2ee);
          color: var(--accent-color, #1c6f5d);
          border-color: var(--accent-color, #1c6f5d);
        }

        .pq-status-inspection,
        .pq-status-packaging {
          background: var(--warning-color-soft, #fdf3d8);
          color: var(--warning-color, #a66a00);
          border-color: var(--warning-color, #a66a00);
        }

        .pq-status-needs-qr {
          background: var(--danger-color-soft, #fbe9e3);
          color: var(--danger-color, #b3401f);
          border-color: var(--danger-color, #b3401f);
        }

        .pq-progress {
          position: relative;
          display: inline-flex;
          align-items: center;
          width: 100%;
          min-width: 90px;
          height: 18px;
          background: var(--surface-muted, #f0f2f5);
          border-radius: 999px;
          overflow: hidden;
        }

        .pq-progress-bar {
          height: 100%;
          background: var(--accent-color, #1c6f5d);
          border-radius: 999px 0 0 999px;
          transition: width 0.2s ease;
        }

        .pq-progress-bar-attn {
          background: var(--danger-color, #b3401f);
        }

        .pq-progress-label {
          position: absolute;
          right: 8px;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-color, #1f2933);
        }

        .pq-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .pq-summary-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .pq-summary-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-color, #1f2933);
        }

        .pq-summary-value-attn {
          color: var(--danger-color, #b3401f);
        }

        .pq-summary-label {
          font-size: 0.76rem;
          color: var(--text-muted, #5a6570);
        }

        .pq-action-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .pq-chart {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pq-chart-row {
          display: grid;
          grid-template-columns: 120px 1fr 70px;
          align-items: center;
          gap: 10px;
        }

        .pq-chart-label {
          font-size: 0.82rem;
          color: var(--text-muted, #5a6570);
        }

        .pq-chart-track {
          height: 10px;
          background: var(--surface-muted, #f0f2f5);
          border-radius: 999px;
          overflow: hidden;
        }

        .pq-chart-bar {
          height: 100%;
          background: var(--accent-color, #1c6f5d);
          border-radius: 999px;
          transition: width 0.2s ease;
        }

        .pq-chart-value {
          font-size: 0.8rem;
          font-weight: 600;
          text-align: right;
        }

        .pq-notification-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pq-notification {
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          border: 1px solid transparent;
        }

        .pq-notification-warning {
          background: var(--warning-color-soft, #fdf3d8);
          color: var(--warning-color, #a66a00);
          border-color: var(--warning-color, #a66a00);
        }

        .pq-notification-success {
          background: var(--accent-color-soft, #e4f2ee);
          color: var(--accent-color, #1c6f5d);
          border-color: var(--accent-color, #1c6f5d);
        }

        .pq-notification-info {
          background: var(--surface-muted, #f6f8fa);
          color: var(--text-color, #1f2933);
          border-color: var(--border-color, #dfe4ea);
        }

        .pq-quick-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pq-coldstorage-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pq-coldstorage-row {
          display: grid;
          grid-template-columns: 24px 1fr;
          align-items: center;
          gap: 10px;
        }

        .pq-coldstorage-id {
          font-weight: 700;
          font-size: 0.85rem;
        }

        [data-theme='dark'] .pq-table,
        [data-theme='dark'] .empty-state {
          --pq-border: #333d47;
          --pq-surface-muted: #222a34;
          --pq-text-muted: #99a4b0;
        }

        [data-theme='dark'] .pq-status-ready {
          background: rgba(79, 191, 159, 0.14);
          color: #4fbf9f;
          border-color: #4fbf9f;
        }

        [data-theme='dark'] .pq-status-inspection,
        [data-theme='dark'] .pq-status-packaging {
          background: rgba(224, 168, 47, 0.14);
          color: #e0a82f;
          border-color: #e0a82f;
        }

        [data-theme='dark'] .pq-status-needs-qr {
          background: rgba(226, 112, 79, 0.14);
          color: #e2704f;
          border-color: #e2704f;
        }

        [data-theme='dark'] .pq-progress {
          background: #222a34;
        }

        [data-theme='dark'] .pq-progress-label,
        [data-theme='dark'] .pq-summary-value {
          color: #e7ebef;
        }

        [data-theme='dark'] .pq-chart-track {
          background: #222a34;
        }

        [data-theme='dark'] .pq-notification-info {
          background: #222a34;
          color: #e7ebef;
          border-color: #333d47;
        }

        .pq-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 20, 25, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .pq-modal {
          width: 100%;
          max-width: 420px;
          background: var(--surface-color, #ffffff);
          border: 1px solid var(--border-color, #dfe4ea);
          border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
          display: flex;
          flex-direction: column;
        }

        .pq-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #dfe4ea);
        }

        .pq-modal-header h3 {
          margin: 0;
          font-size: 1.05rem;
        }

        .pq-modal-close {
          background: none;
          border: none;
          font-size: 1.3rem;
          line-height: 1;
          cursor: pointer;
          color: var(--text-muted, #5a6570);
          padding: 2px 6px;
        }

        .pq-modal-body {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pq-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pq-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .pq-field label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-muted, #5a6570);
        }

        .pq-field input,
        .pq-field select {
          font-size: 0.92rem;
          padding: 9px 11px;
          border: 1px solid var(--border-color, #dfe4ea);
          border-radius: 7px;
          background: var(--surface-color, #ffffff);
          color: var(--text-color, #1f2933);
        }

        .pq-field input:focus,
        .pq-field select:focus {
          outline: 2px solid var(--accent-color, #1c6f5d);
          outline-offset: 1px;
        }

        .pq-modal-error {
          margin: 0;
          font-size: 0.85rem;
          color: var(--danger-color, #b3401f);
        }

        .pq-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid var(--border-color, #dfe4ea);
        }

        [data-theme='dark'] .pq-modal {
          background: #1b222b;
          border-color: #333d47;
        }

        [data-theme='dark'] .pq-modal-header,
        [data-theme='dark'] .pq-modal-actions {
          border-color: #333d47;
        }

        [data-theme='dark'] .pq-field input,
        [data-theme='dark'] .pq-field select {
          background: #1b222b;
          border-color: #333d47;
          color: #e7ebef;
        }
      `}</style>
    </DashboardShell>
  )
}
