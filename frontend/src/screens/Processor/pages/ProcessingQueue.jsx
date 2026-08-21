import { useNavigate } from 'react-router-dom'
import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

const STATUS_LABELS = {
  ready: { label: 'Ready', action: 'Start' },
  inspection: { label: 'Inspection', action: 'Continue' },
}

/**
 * Incoming Processing Queue preview on the processor dashboard.
 * Carcasses that have moved to "processing" are hidden here — they only
 * show up on the full processing queue page. Clicking "Start"/"Continue"
 * or "View all" navigates to that page, where the actual status change
 * (with confirmation) happens.
 */
export function ProcessingQueue() {
  const { carcasses } = useProcessorData()
  const navigate = useNavigate()

  const visibleCarcasses = carcasses.filter((c) => c.status !== 'processing')

  const goToQueue = () => navigate('/dashboard/processor/queue')

  return (
    <Panel
      title="Incoming processing queue"
      action={
        <a href="#" className="link" onClick={(e) => { e.preventDefault(); goToQueue() }}>
          View all
        </a>
      }
    >
      {visibleCarcasses.length === 0 ? (
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
            {visibleCarcasses.map((c) => {
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
                    <button className="btn btn-outline btn-sm" onClick={goToQueue}>
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
