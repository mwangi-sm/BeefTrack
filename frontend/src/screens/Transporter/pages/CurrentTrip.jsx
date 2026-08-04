import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { Panel, DetailRow, ProgressBar, LoadingState, ErrorState, EmptyState } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useAsync } from '../services/useTransporter'
import { getActiveTrip, updateTripStatus } from '../services/transporterApi'

const statusLabel = {
  not_started: 'Not started',
  in_transit: 'In transit',
  paused: 'Paused',
  delivered: 'Delivered',
}

export function CurrentTrip() {
  const navigate = useNavigate()
  const { data: trip, loading, error, reload } = useAsync(getActiveTrip, [])
  const [busy, setBusy] = useState(false)

  async function setStatus(status) {
    setBusy(true)
    try {
      await updateTripStatus(status)
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DashHead title="Current Trip" subtitle="Live status of the delivery you're on right now." />

      {loading && <Panel><LoadingState label="Loading current trip…" /></Panel>}
      {!loading && error && <Panel><ErrorState message="Couldn't load your active trip." onRetry={reload} /></Panel>}
      {!loading && !error && !trip && (
        <Panel>
          <EmptyState icon={IconPaths.truck} title="No trip in progress" subtitle="Start a trip from an assigned delivery to see it here." />
        </Panel>
      )}

      {!loading && !error && trip && (
        <div className="grid-2col">
          <div>
            <Panel title={`Trip ${trip.tripId}`} action={<span className="status-pill status-ok">{statusLabel[trip.status] || trip.status}</span>}>
              <DetailRow label="Pickup" value={trip.pickup} />
              <DetailRow label="Destination" value={trip.destination} />
              <DetailRow label="Animal details" value={trip.animal} />
              <DetailRow label="Vehicle" value={trip.vehicle} />
              <DetailRow label="ETA" value={trip.eta} />
              <DetailRow label="Distance remaining" value={`${trip.distanceRemainingKm} km`} />
              <div style={{ marginTop: 14 }}>
                <ProgressBar percent={trip.progressPercent} note={`${trip.progressPercent}% of route covered`} />
              </div>
            </Panel>

            <Panel title="Route">
              <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: 0 }}>{trip.route}</p>
            </Panel>
          </div>

          <div>
            <Panel title="Trip controls">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {trip.status !== 'in_transit' && trip.status !== 'delivered' && (
                  <button className="btn btn-primary" disabled={busy} onClick={() => setStatus('in_transit')}>
                    <Icon size={15} style={{ marginRight: 6 }}>{IconPaths.truck}</Icon>
                    Start journey
                  </button>
                )}
                {trip.status === 'in_transit' && (
                  <button className="btn btn-outline" disabled={busy} onClick={() => setStatus('paused')}>
                    Pause
                  </button>
                )}
                {trip.status === 'paused' && (
                  <button className="btn btn-primary" disabled={busy} onClick={() => setStatus('in_transit')}>
                    Resume
                  </button>
                )}
                {trip.status !== 'delivered' && (
                  <button className="btn btn-outline" disabled={busy} onClick={() => setStatus('delivered')}>
                    <Icon size={15} style={{ marginRight: 6 }}>{IconPaths.check}</Icon>
                    Mark delivered
                  </button>
                )}
                <button className="btn btn-outline" onClick={() => navigate(`/dashboard/transporter/route`)}>
                  <Icon size={15} style={{ marginRight: 6 }}>{IconPaths.route}</Icon>
                  View live GPS
                </button>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  )
}