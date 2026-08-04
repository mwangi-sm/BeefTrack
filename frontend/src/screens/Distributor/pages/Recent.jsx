import { useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { Panel, ActivityItem } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useDistributorData } from '../context/useDistributorData'
import { formatActivityTime } from '../context/distributorDataUtils'
import { activityContent } from '../context/Activitycontent'

export function RecentContent() {
  const { activityLog } = useDistributorData()
  const navigate = useNavigate()

  return (
    <>
      <DashHead
        greeting="Recent activity"
        title=""
        subtitle="Every shipment and delivery event across your warehouse."
        actions={
          <button className="btn btn-outline" onClick={() => navigate('/dashboard/distributor')}>
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.grid}</Icon>Back to dashboard
          </button>
        }
      />

      <Panel title={`All activity (${activityLog.length})`}>
        {activityLog.length === 0 ? (
          <p className="recent-empty">No activity yet.</p>
        ) : (
          activityLog.map((entry) => (
            <ActivityItem key={entry.id} text={activityContent(entry)} time={formatActivityTime(entry.timestamp)} />
          ))
        )}
      </Panel>

      <style>{`
        .recent-empty {
          color: var(--text-muted, #5a6570);
          padding: 8px 0;
        }
      `}</style>
    </>
  )
}
