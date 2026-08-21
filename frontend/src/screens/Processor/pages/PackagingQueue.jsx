import { useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

const PACKAGING_STATUS_LABELS = {
  'in-packaging': 'In Packaging',
  'on-hold': 'On Hold',
  completed: 'Completed',
}

/**
 * Packaging Queue table — shows batches currently being packaged, their
 * operator, and live progress. Progress renders as a bar when it's a
 * number, or a "Complete" pill when packaging has finished.
 */
export function PackagingQueue() {
  const navigate = useNavigate()
  const { packagingQueue } = useProcessorData()

  return (
    <Panel
      title="Packaging queue"
      action={
        <a
          href="#"
          className="link"
          onClick={(e) => {
            e.preventDefault()
            navigate('/dashboard/processor/packaging')
          }}
        >
          View all
        </a>
      }
    >
      {packagingQueue.length === 0 ? (
        <p className="empty-state">No batches in packaging right now.</p>
      ) : (
        <table className="pq-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Packaging type</th>
              <th>Operator</th>
              <th>Started</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {packagingQueue.map((item) => (
              <tr key={item.batchId}>
                <td>{item.batchId}</td>
                <td>{item.packagingType}</td>
                <td>{item.operator}</td>
                <td>{item.startedAt}</td>
                <td>
                  {item.progressPercent === 'complete' ? (
                    <span className="pq-status pq-status-ready">Complete</span>
                  ) : (
                    <div className="pq-progress" aria-label={`${item.progressPercent}% complete`}>
                      <div
                        className="pq-progress-bar"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                      <span className="pq-progress-label">{item.progressPercent}%</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}

/**
 * Full packaging queue page. Two sections:
 *  - "Packaging queue": every item, with live progress (same as the preview).
 *  - "In packaging": the same items with a Date added / Status / Hold /
 *    Complete row, mirroring "In processing" on ProceesingQueuePage.jsx.
 *    Unlike In processing, there's no separate staging trigger here — items
 *    land in packagingQueue already committed via the Package products
 *    modal, so both sections currently show the same set. "Complete" also
 *    records the item in Cold Storage as a 'package'.
 */
export function PackagingPageContent() {
  const navigate = useNavigate()
  const { packagingQueue, updatePackagingItemStatus, addToColdStorage } = useProcessorData()

  const handleHold = (batchId) => updatePackagingItemStatus(batchId, 'on-hold')

  const handleComplete = (item) => {
    updatePackagingItemStatus(item.batchId, 'completed')
    addToColdStorage({
      itemType: 'package',
      sourceId: item.batchId,
      details: { packagingType: item.packagingType, operator: item.operator },
      status: 'Packaged',
    })
  }

  return (
    <>
      <DashHead
        greeting="Packaging queue"
        title=""
        subtitle="Every batch currently being packaged."
        actions={
          <button className="btn btn-outline" onClick={() => navigate('/dashboard/processor')}>
            Back to dashboard
          </button>
        }
      />

      <Panel title="Packaging queue">
        {packagingQueue.length === 0 ? (
          <p className="empty-state">No batches in packaging right now.</p>
        ) : (
          <table className="pq-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Packaging type</th>
                <th>Operator</th>
                <th>Started</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {packagingQueue.map((item) => (
                <tr key={item.batchId}>
                  <td>{item.batchId}</td>
                  <td>{item.packagingType}</td>
                  <td>{item.operator}</td>
                  <td>{item.startedAt}</td>
                  <td>
                    {item.progressPercent === 'complete' ? (
                      <span className="pq-status pq-status-ready">Complete</span>
                    ) : (
                      <div className="pq-progress" aria-label={`${item.progressPercent}% complete`}>
                        <div
                          className="pq-progress-bar"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                        <span className="pq-progress-label">{item.progressPercent}%</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="In packaging">
        {packagingQueue.length === 0 ? (
          <p className="empty-state">No batches in packaging right now.</p>
        ) : (
          <table className="pq-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Operator</th>
                <th>Date added</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {packagingQueue.map((item) => (
                <tr key={item.batchId}>
                  <td>{item.batchId}</td>
                  <td>{item.operator}</td>
                  <td>{item.dateAdded || item.startedAt}</td>
                  <td>
                    <span className={`pq-status pq-status-${(item.status || 'in-packaging')}`}>
                      {PACKAGING_STATUS_LABELS[item.status] || 'In Packaging'}
                    </span>
                  </td>
                  <td>
                    <div className="pq-inproc-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => handleHold(item.batchId)}>Hold</button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleComplete(item)}>Complete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <style>{`
        .pq-inproc-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pq-status-in-packaging {
          background: rgba(49, 130, 206, 0.12);
          color: #2b6cb0;
          border-color: #2b6cb0;
        }

        .pq-status-on-hold {
          background: var(--warning-color-soft, #fdf3d8);
          color: var(--warning-color, #a66a00);
          border-color: var(--warning-color, #a66a00);
        }

        .pq-status-completed {
          background: var(--accent-color-soft, #e4f2ee);
          color: var(--accent-color, #1c6f5d);
          border-color: var(--accent-color, #1c6f5d);
        }

        [data-theme='dark'] .pq-status-in-packaging {
          background: rgba(79, 158, 224, 0.14);
          color: #6bb2f0;
          border-color: #6bb2f0;
        }

        [data-theme='dark'] .pq-status-on-hold {
          background: rgba(224, 168, 47, 0.14);
          color: #e0a82f;
          border-color: #e0a82f;
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