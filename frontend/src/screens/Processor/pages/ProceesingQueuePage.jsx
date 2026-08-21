import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { Panel } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useProcessorData } from '../context/useProcessorData'

const IN_PROCESSING_ANCHOR = 'in-processing-section'

const STATUS_LABELS = {
  ready: { label: 'Ready', action: 'Start' },
  inspection: { label: 'Inspection', action: 'Continue' },
  processing: { label: 'Processing', action: 'Continue' },
  'cold storage': { label: 'Cold Storage', action: null },
  'in-processing': { label: 'In Processing', action: null },
  'on-hold': { label: 'On Hold', action: null },
  completed: { label: 'Completed', action: null },
  'pending approval': { label: 'Pending Approval', action: 'Review' },
}

const IN_PROCESSING_STATUSES = new Set(['in-processing', 'on-hold', 'completed'])

/**
 * Full processing queue page. Two sections:
 *  - "All carcasses": every carcass, any status.
 *  - "In processing": carcasses that reached in-processing/on-hold/completed.
 *
 * Flow:
 *   ready --(Start, confirm)--> inspection
 *   inspection --(Continue)--> "Take to?" --(Processing)--> processing
 *                                        \--(Cold storage)--> cold storage
 *                                            + recorded in Cold Storage (ColdStoragePage.jsx)
 *   processing --(Continue)--> in-processing (shown in "In processing" section)
 *   in-processing/on-hold/completed --(Hold)--> on-hold
 *   in-processing/on-hold/completed --(Complete)--> completed
 *                                            + recorded in Cold Storage as a "cut"
 */
export function ProcessingQueuePageContent() {
  const { carcasses, updateCarcassStatus, addToColdStorage } = useProcessorData()
  const navigate = useNavigate()
  const location = useLocation()

  const [confirmId, setConfirmId] = useState(null)
  const [takeToId, setTakeToId] = useState(null)

  const inProcessingRef = useRef(null)

  const inProcessingCarcasses = carcasses.filter((c) => IN_PROCESSING_STATUSES.has(c.status))

  const handleAction = (carcass) => {
    if (carcass.status === 'ready') {
      setConfirmId(carcass.id)
      return
    }
    if (carcass.status === 'inspection') {
      setTakeToId(carcass.id)
      return
    }
    if (carcass.status === 'processing') {
      updateCarcassStatus(carcass.id, 'in-processing')
      inProcessingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
  }

  const handleConfirm = (confirmed) => {
    if (confirmId == null) return
    updateCarcassStatus(confirmId, confirmed ? 'inspection' : 'pending approval')
    setConfirmId(null)
  }

  const handleTakeTo = (destination) => {
    if (takeToId == null) return
    const carcass = carcasses.find((c) => c.id === takeToId)
    updateCarcassStatus(takeToId, destination)

    if (destination === 'cold storage' && carcass) {
      addToColdStorage({
        itemType: 'carcass',
        sourceId: carcass.id,
        details: { animalId: carcass.animalId, grade: carcass.grade },
        status: 'Pending Approval',
      })
    }

    setTakeToId(null)
  }

  const handleHold = (carcassId) => updateCarcassStatus(carcassId, 'on-hold')

  const handleComplete = (carcassId) => {
    const carcass = carcasses.find((c) => c.id === carcassId)
    updateCarcassStatus(carcassId, 'completed')

    if (carcass) {
      addToColdStorage({
        itemType: 'cut',
        sourceId: carcass.id,
        details: { animalId: carcass.animalId, grade: carcass.grade },
        status: 'Completed',
      })
    }
  }

  useEffect(() => {
    if (location.hash === `#${IN_PROCESSING_ANCHOR}` && inProcessingRef.current) {
      inProcessingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

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
                const isChoosingDestination = takeToId === c.id

                return (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.animalId}</td>
                    <td>{c.grade}</td>
                    <td>{c.arrivalTime}</td>
                    <td>
                      <span className={`pq-status pq-status-${c.status.replace(/\s+/g, '-')}`}>
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
                      ) : isChoosingDestination ? (
                        <div className="pq-confirm">
                          <span className="pq-confirm-text">Take to?</span>
                          <button className="btn btn-primary btn-sm" onClick={() => handleTakeTo('processing')}>Processing</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleTakeTo('cold storage')}>Cold storage</button>
                        </div>
                      ) : meta.action ? (
                        <button className="btn btn-outline btn-sm" onClick={() => handleAction(c)}>
                          {meta.action}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Panel>

      <div id={IN_PROCESSING_ANCHOR} ref={inProcessingRef}>
        <Panel title="In processing">
          {inProcessingCarcasses.length === 0 ? (
            <p className="empty-state">No carcasses in processing right now.</p>
          ) : (
            <table className="pq-table">
              <thead>
                <tr>
                  <th>Carcass</th>
                  <th>Animal ID</th>
                  <th>Date added</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {inProcessingCarcasses.map((c) => {
                  const meta = STATUS_LABELS[c.status] || { label: c.status }
                  return (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.animalId}</td>
                      <td>{c.arrivalTime}</td>
                      <td>
                        <span className={`pq-status pq-status-${c.status.replace(/\s+/g, '-')}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <div className="pq-inproc-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => handleHold(c.id)}>Hold</button>
                          <button className="btn btn-primary btn-sm" onClick={() => handleComplete(c.id)}>Complete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

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

        .pq-inproc-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pq-status-pending-approval,
        .pq-status-on-hold {
          background: var(--warning-color-soft, #fdf3d8);
          color: var(--warning-color, #a66a00);
          border-color: var(--warning-color, #a66a00);
        }

        .pq-status-cold-storage,
        .pq-status-in-processing {
          background: rgba(49, 130, 206, 0.12);
          color: #2b6cb0;
          border-color: #2b6cb0;
        }

        .pq-status-completed {
          background: var(--accent-color-soft, #e4f2ee);
          color: var(--accent-color, #1c6f5d);
          border-color: var(--accent-color, #1c6f5d);
        }

        [data-theme='dark'] .pq-status-pending-approval,
        [data-theme='dark'] .pq-status-on-hold {
          background: rgba(224, 168, 47, 0.14);
          color: #e0a82f;
          border-color: #e0a82f;
        }

        [data-theme='dark'] .pq-status-cold-storage,
        [data-theme='dark'] .pq-status-in-processing {
          background: rgba(79, 158, 224, 0.14);
          color: #6bb2f0;
          border-color: #6bb2f0;
        }

        [data-theme='dark'] .pq-status-completed {
          background: rgba(79, 191, 159, 0.14);
          color: #4fbf9f;
          border-color: #4fbf9f;
        }
      `}</style>
    </>
  )
}