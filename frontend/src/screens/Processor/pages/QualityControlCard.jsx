import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

/**
 * Quality Control — today's inspection counts plus current cold-chain
 * temperature and food safety compliance status.
 */
export function QualityControlCard() {
  const { qualityControl } = useProcessorData()
  const { inspectionsToday, passed, pending, rejected, temperatureC, foodSafetyStatus } =
    qualityControl

  return (
    <Panel title="Quality control" action={<a href="#" className="link">View all</a>}>
      <div className="pq-summary-grid">
        <div className="pq-summary-item">
          <div className="pq-summary-value">{inspectionsToday}</div>
          <div className="pq-summary-label">Today's inspections</div>
        </div>
        <div className="pq-summary-item">
          <div className="pq-summary-value">{passed}</div>
          <div className="pq-summary-label">Passed</div>
        </div>
        <div className="pq-summary-item">
          <div className="pq-summary-value">{pending}</div>
          <div className="pq-summary-label">Pending</div>
        </div>
        <div className="pq-summary-item">
          <div className="pq-summary-value">{rejected}</div>
          <div className="pq-summary-label">Rejected</div>
        </div>
        <div className="pq-summary-item">
          <div className="pq-summary-value">
            {temperatureC !== null ? `${temperatureC}°C` : '—'}
          </div>
          <div className="pq-summary-label">Temperature</div>
        </div>
        <div className="pq-summary-item">
          <div
            className={`pq-summary-value pq-summary-value-status${
              foodSafetyStatus === 'flagged' ? ' pq-summary-value-attn' : ''
            }`}
          >
            {foodSafetyStatus
              ? foodSafetyStatus.charAt(0).toUpperCase() + foodSafetyStatus.slice(1)
              : '—'}
          </div>
          <div className="pq-summary-label">Food safety</div>
        </div>
      </div>
    </Panel>
  )
}