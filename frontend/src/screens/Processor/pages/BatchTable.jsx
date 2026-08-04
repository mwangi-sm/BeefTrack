import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

const STAGE_LABELS = {
  packaging: { label: 'Packaging', action: 'Continue' },
  'needs-qr': { label: 'Needs QR', action: 'Generate' },
  ready: { label: 'Ready', action: 'Dispatch' },
}

/**
 * Active Production Batches table. Each row's action button advances the
 * batch through its lifecycle: packaging -> needs-qr -> ready -> dispatch.
 * "Dispatch" is a hand-off point to the Distributor side, so it doesn't
 * change local state here — it's a TODO for once that flow is wired up.
 */
export function BatchTable() {
  const { batches, generateQR } = useProcessorData()

  const handleAction = (batch) => {
    if (batch.stage === 'needs-qr') {
      generateQR(batch.id)
      return
    }
    if (batch.stage === 'ready') {
      // TODO: wire to dispatch/hand-off flow once it exists
      // (likely a navigate() to a dispatch screen, similar to how
      // Distributor's Dispatch button pre-fills ScheduleDelivery)
      return
    }
    // 'packaging' stage's "Continue" action opens the packaging queue view;
    // no state change needed here since PackagingQueue.jsx owns progress.
  }

  return (
    <Panel title="Active production batches" action={<a href="#" className="link">View all</a>}>
      {batches.length === 0 ? (
        <p className="empty-state">No batches created yet.</p>
      ) : (
        <table className="pq-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Product</th>
              <th>Category</th>
              <th>Weight</th>
              <th>Packages</th>
              <th>Stage</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => {
              const meta = STAGE_LABELS[b.stage] || { label: b.stage, action: 'View' }
              return (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.product}</td>
                  <td>{b.category}</td>
                  <td>{b.weightKg} kg</td>
                  <td>{b.packages}</td>
                  <td>
                    <span className={`pq-status pq-status-${b.stage}`}>{meta.label}</span>
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => handleAction(b)}>
                      {meta.action}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Panel>
  )
}