import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ProcessorShell } from '../components/Processorshell'
import { DashHead } from '../../../components/DashHead'
import { NoteBanner, Panel, TraceabilityLookup } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'
import { ProcessorStats } from './ProcessorStats'
import { QuickActions } from './QuickActions'
import { ProcessingQueue } from './ProcessingQueue'
import { ProcessingQueuePageContent } from './ProceesingQueuePage'
import { BatchTable } from './BatchTable'
import { BatchesPageContent } from './BatchesPage'
import { PackagingQueue, PackagingPageContent } from './PackagingQueue'
import { ColdStoragePageContent } from './ColdStoragePage'
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

// Anchor the Packaging Queue panel is scrolled to when "Continue" is clicked
// from Active production batches or the Incoming processing queue — same
// pattern as Distributor's SHIPMENT_HISTORY_ANCHOR. Must match the id used
// on BatchTable.jsx's and ProceesingQueuePage.jsx's navigate() calls.
const PACKAGING_QUEUE_ANCHOR = 'packaging-queue-panel'

function ProcessorHome({ userName }) {
  const { notifications } = useProcessorData()
  const [activeModal, setActiveModal] = useState(null)
  // Set when "Continue" is clicked on a packaging-stage batch, so the
  // Package products modal opens pre-filled with that batch instead of blank.
  const [packagePrefillBatchId, setPackagePrefillBatchId] = useState(null)
  const location = useLocation()
  const packagingQueueRef = useRef(null)

  const urgentNotifications = notifications.filter((n) => n.type === 'warning')

  const closeModal = () => {
    setActiveModal(null)
    setPackagePrefillBatchId(null)
  }

  const handleContinuePackaging = (batch) => {
    setPackagePrefillBatchId(batch.id)
    setActiveModal('package')
    // Also scroll down so the Packaging Queue panel is in view behind the
    // modal, for once it's closed.
    packagingQueueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Handles arriving via navigate('/dashboard/processor#packaging-queue-panel')
  // from the Incoming processing queue's "Continue" button.
  useEffect(() => {
    if (location.hash === `#${PACKAGING_QUEUE_ANCHOR}` && packagingQueueRef.current) {
      packagingQueueRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <>
      <DashHead
        greeting="Welcome,"
        title={userName}
        subtitle="Cutting, packaging and labelling status across today's production."
        actions={
          <QuickActions
            onReceiveCarcass={() => setActiveModal('receive')}
            onCreateBatch={() => setActiveModal('batch')}
            onPackageProducts={() => { setPackagePrefillBatchId(null); setActiveModal('package') }}
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
          <BatchTable onContinuePackaging={handleContinuePackaging} />
          <div id={PACKAGING_QUEUE_ANCHOR} ref={packagingQueueRef}>
            <PackagingQueue />
          </div>
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
        isOpen={activeModal === 'receive'}
        onClose={closeModal}
      />
      <CreateBatchModal
        isOpen={activeModal === 'batch'}
        onClose={closeModal}
      />
      <PackageProductsModal
        isOpen={activeModal === 'package'}
        onClose={closeModal}
        initialBatchId={packagePrefillBatchId}
      />

      <style>{`
        .pq-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 20, 25, 0.55);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: pq-overlay-in 0.15s ease-out;
        }

        .pq-modal {
          --pq-border: var(--border-color, #dfe4ea);
          --pq-surface: var(--surface-color, #ffffff);
          --pq-surface-muted: var(--surface-muted, #f6f8fa);
          --pq-text: var(--text-color, #1f2933);
          --pq-text-muted: var(--text-muted, #5a6570);
          --pq-accent: var(--accent-color, #1c6f5d);
          --pq-danger: var(--danger-color, #b3401f);
          --pq-danger-soft: var(--danger-color-soft, #fbe9e3);
          width: 100%;
          max-width: 440px;
          max-height: 85vh;
          background: var(--pq-surface);
          color: var(--pq-text);
          border: 1px solid var(--pq-border);
          border-radius: 14px;
          box-shadow: 0 24px 60px -12px rgba(15, 20, 25, 0.35), 0 2px 8px rgba(15, 20, 25, 0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: pq-modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes pq-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pq-modal-in {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .pq-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid var(--pq-border);
          flex-shrink: 0;
        }

        .pq-modal-header h3 {
          margin: 0;
          font-size: 1.08rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .pq-modal-close {
          background: none;
          border: none;
          font-size: 1.3rem;
          line-height: 1;
          cursor: pointer;
          color: var(--pq-text-muted);
          padding: 4px 8px;
          border-radius: 8px;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .pq-modal-close:hover {
          background: var(--pq-surface-muted);
          color: var(--pq-text);
        }

        .pq-modal-body {
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        .pq-modal-body::-webkit-scrollbar {
          width: 6px;
        }

        .pq-modal-body::-webkit-scrollbar-thumb {
          background: var(--pq-border);
          border-radius: 6px;
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
          color: var(--pq-text-muted);
        }

        .pq-field input,
        .pq-field select {
          font-size: 0.95rem;
          padding: 10px 12px;
          border: 1px solid var(--pq-border);
          border-radius: 8px;
          background: var(--pq-surface);
          color: var(--pq-text);
          transition: border-color 0.15s ease;
        }

        .pq-field input:focus,
        .pq-field select:focus {
          outline: 2px solid var(--pq-accent);
          outline-offset: 1px;
          border-color: var(--pq-accent);
        }

        .pq-modal-error {
          margin: 0;
          padding: 10px 12px;
          font-size: 0.85rem;
          color: var(--pq-danger);
          background: var(--pq-danger-soft);
          border-radius: 8px;
        }

        .pq-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 22px;
          border-top: 1px solid var(--pq-border);
          background: var(--pq-surface);
          flex-shrink: 0;
        }

        [data-theme='dark'] .pq-modal {
          --pq-border: #333d47;
          --pq-surface: #1b222b;
          --pq-surface-muted: #222a34;
          --pq-text: #e7ebef;
          --pq-text-muted: #99a4b0;
          --pq-accent: #4fbf9f;
          --pq-danger: #e2704f;
          --pq-danger-soft: rgba(226, 112, 79, 0.14);
        }

        [data-theme='dark'] .pq-modal-overlay {
          background: rgba(4, 6, 8, 0.65);
        }

        @media (max-width: 480px) {
          .pq-field-row {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pq-modal-overlay,
          .pq-modal {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}

export function ProcessorDashboard({ onLogout, onToggleTheme, userName = 'User', fullname }) {
  const displayName = fullname || userName || 'User'

  return (
    <ProcessorShell onLogout={onLogout} onToggleTheme={onToggleTheme} userName={displayName}>
      <Routes>
        <Route index element={<ProcessorHome userName={displayName} />} />
        <Route path="queue" element={<ProcessingQueuePageContent />} />
        <Route path="batches" element={<BatchesPageContent />} />
        <Route path="packaging" element={<PackagingPageContent />} />
        <Route path="cold-storage" element={<ColdStoragePageContent />} />
      </Routes>
    </ProcessorShell>
  )
}