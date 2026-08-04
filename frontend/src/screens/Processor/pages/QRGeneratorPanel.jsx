import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

/**
 * QR Generation — summary counts plus quick actions. "Generate QR" here
 * acts on whichever batch is next in line (first batch with stage
 * 'needs-qr'); once a proper batch-picker UI exists, wire that in instead.
 */
export function QRGeneratorPanel() {
  const { qr, batches, generateQR } = useProcessorData()

  const nextBatchNeedingQR = batches.find((b) => b.stage === 'needs-qr')

  const handleGenerate = () => {
    if (nextBatchNeedingQR) {
      generateQR(nextBatchNeedingQR.id)
    }
  }

  const handlePrintLabels = () => {
    // TODO: wire to label printing flow once it exists
  }

  const handleDownloadPdf = () => {
    // TODO: wire to PDF export flow once it exists
  }

  return (
    <Panel title="QR generation">
      <div className="pq-summary-grid">
        <div className="pq-summary-item">
          <div className="pq-summary-value">{qr.readyCount}</div>
          <div className="pq-summary-label">Ready</div>
        </div>
        <div className="pq-summary-item">
          <div className="pq-summary-value">{qr.generatedCount}</div>
          <div className="pq-summary-label">Already generated</div>
        </div>
        <div className="pq-summary-item">
          <div className="pq-summary-value">{qr.printLabelsCount}</div>
          <div className="pq-summary-label">Print labels</div>
        </div>
        <div className="pq-summary-item">
          <div className="pq-summary-value">{qr.pendingCount}</div>
          <div className="pq-summary-label">Pending</div>
        </div>
      </div>

      <div className="pq-action-row">
        <button
          className="btn btn-primary btn-sm"
          onClick={handleGenerate}
          disabled={!nextBatchNeedingQR}
        >
          Generate QR
        </button>
        <button className="btn btn-outline btn-sm" onClick={handlePrintLabels}>
          Print labels
        </button>
        <button className="btn btn-outline btn-sm" onClick={handleDownloadPdf}>
          Download PDF
        </button>
      </div>
    </Panel>
  )
}