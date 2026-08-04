import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

/**
 * Inventory Overview — quick-glance summary of finished products, raw
 * materials, packaging materials, and cold storage utilization.
 */
export function InventorySummary() {
  const { inventory } = useProcessorData()

  return (
    <Panel title="Inventory overview" action={<a href="#" className="link">View all</a>}>
      <div className="pq-summary-grid">
        <div className="pq-summary-item">
          <div className="pq-summary-value">{inventory.finishedProductsPacks.toLocaleString()}</div>
          <div className="pq-summary-label">Finished products (packs)</div>
        </div>
        <div className="pq-summary-item">
          <div className="pq-summary-value">{inventory.rawMaterialsKg.toLocaleString()} kg</div>
          <div className="pq-summary-label">Raw materials</div>
        </div>
        <div className="pq-summary-item">
          <div className="pq-summary-value">{inventory.packagingMaterialsUnits.toLocaleString()}</div>
          <div className="pq-summary-label">Packaging materials (units)</div>
        </div>
        <div className="pq-summary-item">
          <div className="pq-summary-value">{inventory.coldStoragePercent}%</div>
          <div className="pq-summary-label">Cold storage</div>
        </div>
      </div>
    </Panel>
  )
}