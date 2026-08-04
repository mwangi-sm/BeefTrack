import { useProcessorData } from '../context/useProcessorData'

/**
 * Quick Actions row. "Generate QR" is wired live via context. "Receive
 * carcass", "Create batch", and "Package products" open modals owned by
 * ProcessorDashboard (passed in as props). The rest are still stubbed with
 * TODOs since they need dedicated screens that don't exist yet — same
 * incremental pattern used for Distributor's multi-step flows.
 */
export function QuickActions({ onReceiveCarcass, onCreateBatch, onPackageProducts }) {
  const { batches, generateQR } = useProcessorData()

  const handleReceiveCarcass = () => {
    if (onReceiveCarcass) onReceiveCarcass()
  }

  const handleCreateBatch = () => {
    if (onCreateBatch) onCreateBatch()
  }

  const handlePackageProducts = () => {
    if (onPackageProducts) onPackageProducts()
  }

  const handleGenerateQR = () => {
    const nextBatchNeedingQR = batches.find((b) => b.stage === 'needs-qr')
    if (nextBatchNeedingQR) generateQR(nextBatchNeedingQR.id)
  }

  const handleViewInventory = () => {
    // TODO: navigate to a dedicated inventory screen once one exists
  }

  const handlePrintLabels = () => {
    // TODO: wire to label printing flow once it exists
  }

  const handleReports = () => {
    // TODO: navigate to a reports screen once one exists
  }

  return (
    <div className="pq-quick-actions">
      <button className="btn btn-outline btn-sm" onClick={handleReceiveCarcass}>
        + Receive carcass
      </button>
      <button className="btn btn-outline btn-sm" onClick={handleCreateBatch}>
        + Create batch
      </button>
      <button className="btn btn-outline btn-sm" onClick={handlePackageProducts}>
        + Package products
      </button>
      <button className="btn btn-outline btn-sm" onClick={handleGenerateQR}>
        + Generate QR
      </button>
      <button className="btn btn-outline btn-sm" onClick={handleViewInventory}>
        + View inventory
      </button>
      <button className="btn btn-outline btn-sm" onClick={handlePrintLabels}>
        + Print labels
      </button>
      <button className="btn btn-outline btn-sm" onClick={handleReports}>
        + Reports
      </button>
    </div>
  )
}