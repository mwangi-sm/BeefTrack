import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { Panel } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useProcessorData } from '../context/useProcessorData'

const STATUS_LABELS = {
  ready: { label: 'Ready', action: 'Start' },
  inspection: { label: 'Inspection', action: 'Continue' },
  packaging: { label: 'Packaging', action: 'View' },
  'pending approval': { label: 'Pending Approval', action: 'Review' },
}

/**
 * Full processing queue page — reached via "Start"/"Continue" or "View all"
 * on the dashboard's ProcessingQueue preview. Unlike the preview, this shows
 * every carcass regardless of status (including 'packaging' and
 * 'pending approval'). Clicking "Start" on a 'ready' carcass opens an
 * inline "Are you sure?" confirm in that row: Yes -> 'inspection',
 * No -> 'pending approval'.
 */
export function ProcessingQueuePageContent() {
  const { carcasses, updateCarcassStatus } = useProcessorData()
  const navigate = useNavigate()
  const [confirmId, setConfirmId] = useState(null)

  const handleAction = (carcass) => {
    if (carcass.status === 'ready') {
      setConfirmId(carcass.id)
      return
    }
    if (carcass.status === 'inspection') {
      updateCarcassStatus(carcass.id, 'packaging')
      return
    }
    // packaging / pending approval: no-op until those detail flows exist
  }

  const handleConfirm = (confirmed) => {
    if (confirmId == null) return
    updateCarcassStatus(confirmId, confirmed ? 'inspection' : 'pending approval')
    setConfirmId(null)
  }

  return (
    <>
      <DashHead
        greeting="Processing queue"
        title=""
        subtitle="Every carcass currently moving through processing."
        actions={
          <button className="btn btn-outline" onClick={() => navigate('/dashboard/processor')}>
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.grid}</Icon>Back to dashboard
          </button>
        }
      />

      <Panel title="All carcasses">
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
                const isConfirming = confirmId === c.id

                return (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.animalId}</td>
                    <td>{c.grade}</td>
                    <td>{c.arrivalTime}</td>
                    <td>
                      <span className={`pq-status pq-status-${c.status.replace(' ', '-')}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      {isConfirming ? (
                        <div className="pq-confirm">
                          <span className="pq-confirm-text">Are you sure?</span>
                          <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(true)}>Yes</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleConfirm(false)}>No</button>
                        </div>
                      ) : (
                        <button className="btn btn-outline btn-sm" onClick={() => handleAction(c)}>
                          {meta.action}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Panel>

      <style>{`
        .pq-confirm {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pq-confirm-text {
          font-size: 0.82rem;
          color: var(--text-muted, #5a6570);
          white-space: nowrap;
        }

        .pq-status-pending-approval {
          background: var(--warning-color-soft, #fdf3d8);
          color: var(--warning-color, #a66a00);
          border-color: var(--warning-color, #a66a00);
        }

        [data-theme='dark'] .pq-status-pending-approval {
          background: rgba(224, 168, 47, 0.14);
          color: #e0a82f;
          border-color: #e0a82f;
        }
      `}</style>
    </>
  )
}