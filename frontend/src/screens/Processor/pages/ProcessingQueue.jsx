import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

const STATUS_LABELS = {
  ready: { label: 'Ready', action: 'Start' },
  inspection: { label: 'Inspection', action: 'Continue' },
  packaging: { label: 'Packaging', action: 'View' },
}

/**
 * Incoming Processing Queue table. Reads carcasses straight from context;
 * the action button advances a carcass through ready -> inspection ->
 * packaging, matching the workflow diagram in the layout doc.
 */
export function ProcessingQueue() {
  const { carcasses, updateCarcassStatus } = useProcessorData()

  const handleAction = (carcass) => {
    // TODO: once inspection/cutting screens exist, this should navigate
    // there instead of just advancing status in place.
    if (carcass.status === 'ready') {
      updateCarcassStatus(carcass.id, 'inspection')
    } else if (carcass.status === 'inspection') {
      updateCarcassStatus(carcass.id, 'packaging')
    }
    // 'packaging' status action is "View" — no state change, just navigation
    // once a batch detail screen exists.
  }

  return (
    <Panel title="Incoming processing queue" action={<a href="#" className="link">View all</a>}>
      {carcasses.length === 0 ? (
        <p className="empty-state">No carcasses in the queue yet.</p>
      ) : (
        <table className="pq-table">
          <thead>
            <tr>
              <th>Carcass</th>
              <th>Animal ID</th>
              <th>Grade</th>
              <th>Arrival</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {carcasses.map((c) => {
              const meta = STATUS_LABELS[c.status] || { label: c.status, action: 'View' }
              return (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.animalId}</td>
                  <td>{c.grade}</td>
                  <td>{c.arrivalTime}</td>
                  <td>
                    <span className={`pq-status pq-status-${c.status}`}>{meta.label}</span>
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => handleAction(c)}>
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