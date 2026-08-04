import { StatCard } from '../../../components/DashboardBits'
import { IconPaths } from '../../../components/icons'
import { useProcessorData } from '../context/useProcessorData'

/**
 * Eight-card stat grid for the Processor dashboard. All values are derived
 * from live context state via computeProcessorStats (see processorDataUtils.js)
 * rather than hardcoded, matching the Distributor cleanup pattern.
 */
export function ProcessorStats() {
  const { stats } = useProcessorData()

  return (
    <div className="stat-grid stat-grid-8">
      <StatCard
        icon={IconPaths.abattoir}
        flagText="In progress"
        value={stats.carcassesInProcessing}
        label="Carcasses in processing"
      />
      <StatCard
        icon={IconPaths.cut}
        flagText="Today"
        value={stats.batchesCreatedToday}
        label="Batches created today"
      />
      <StatCard
        icon={IconPaths.storefront}
        flagText="Units"
        value={stats.productsPackaged}
        label="Products packaged"
      />
      <StatCard
        icon={IconPaths.qr}
        flagText="Needs QR"
        flagType={stats.pendingQR > 0 ? 'attn' : undefined}
        value={stats.pendingQR}
        label="Pending QR generation"
      />
      <StatCard
        icon={IconPaths.truck}
        flagText="Today"
        value={`${stats.todaysProductionKg.toLocaleString()} kg`}
        label="Today's production"
      />
      <StatCard
        icon={IconPaths.warehouse}
        flagText="Capacity"
        flagType={stats.coldStoragePercent >= 85 ? 'attn' : undefined}
        value={`${stats.coldStoragePercent}%`}
        label="Cold storage"
      />
      <StatCard
        icon={IconPaths.boxes}
        flagText="Ready"
        value={stats.readyForDistribution}
        label="Ready for distribution"
      />
      <StatCard
        icon={IconPaths.check}
        flagText="Pass rate"
        value={`${stats.qualityChecksPercent}%`}
        label="Quality checks"
      />
    </div>
  )
}