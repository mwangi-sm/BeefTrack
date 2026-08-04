import { useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { Panel, CareRow, LoadingState, ErrorState, EmptyState } from '../../../components/DashboardBits'
import { IconPaths } from '../../../components/icons'
import { useAsync } from '../services/useTransporter'
import { getDeliveryHistory } from '../services/transporterApi'

export function DeliveryHistory() {
  const navigate = useNavigate()
  const { data: history, loading, error, reload } = useAsync(getDeliveryHistory, [])

  return (
    <>
      <DashHead title="Delivery History" subtitle="Deliveries you've completed." />

      <Panel>
        {loading && <LoadingState label="Loading delivery history…" />}
        {!loading && error && <ErrorState message="Couldn't load your delivery history." onRetry={reload} />}
        {!loading && !error && history?.length === 0 && (
          <EmptyState icon={IconPaths.sales} title="No completed deliveries yet" />
        )}
        {!loading && !error && history?.map((h) => (
          <CareRow
            key={h.id}
            id={h.id}
            type={h.destination}
            due={h.date}
            status="ok"
            label="Delivered"
            onClick={() => navigate(`/dashboard/transporter/deliveries/${h.id}`)}
          />
        ))}
      </Panel>
    </>
  )
}