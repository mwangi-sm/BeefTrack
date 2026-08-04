import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

/**
 * Packaging Queue table — shows batches currently being packaged, their
 * operator, and live progress. Progress renders as a bar when it's a
 * number, or a "Complete" pill when packaging has finished.
 */
export function PackagingQueue() {
  const { packagingQueue } = useProcessorData()

  return (
    <Panel title="Packaging queue" action={<a href="#" className="link">View all</a>}>
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