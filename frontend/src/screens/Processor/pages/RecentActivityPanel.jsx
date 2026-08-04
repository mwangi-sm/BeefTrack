import { Panel, ActivityItem } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

/**
 * Recent Activity — reuses the same ActivityItem primitive the original
 * static ProcessorDashboard.jsx used, now fed from context.activityLog
 * instead of hardcoded entries.
 */
export function RecentActivityPanel() {
  const { activityLog } = useProcessorData()

  return (
    <Panel title="Recent activity" action={<a href="#" className="link">View all</a>}>
      {activityLog.length === 0 ? (
        <p className="empty-state">No activity yet.</p>
      ) : (
        activityLog.map((item) => (
          <ActivityItem key={item.id} text={item.text} time={item.timestamp} />
        ))
      )}
    </Panel>
  )
}