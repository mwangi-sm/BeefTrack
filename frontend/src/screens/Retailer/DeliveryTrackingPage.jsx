import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Panel, StatCard, CareRow } from '../../components/DashboardBits'
import { Icon, IconPaths } from '../../components/icons'
import { useRetailerData } from './components/RetailerDataContext'

// Status → label / colour mapping for the delivery pills
const STATUS_CONFIG = {
  in_transit: { label: 'In transit', colour: 'var(--gold-600)', bg: 'rgba(184,135,58,0.16)' },
  arrived: { label: 'Arrived', colour: 'var(--sage-600)', bg: 'rgba(92,122,92,0.14)' },
  departed: { label: 'Departed', colour: 'var(--maroon-800)', bg: 'rgba(90,15,23,0.12)' },
  delivered: { label: 'Delivered', colour: 'var(--sage-600)', bg: 'rgba(92,122,92,0.14)' },
}

// Event status → icon mapping
const EVENT_ICONS = {
  dispatched: IconPaths.truck,
  in_transit: IconPaths.route,
  arrived: IconPaths.storefront,
  departed: IconPaths.truck,
  delivered: IconPaths.check,
}

function DeliveryStatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.in_transit
  return (
    <span
      className="status-pill"
      style={{
        background: cfg.bg,
        color: cfg.colour,
        fontSize: 11.5,
        fontWeight: 600,
      }}
    >
      {cfg.label}
    </span>
  )
}

// Vertical timeline — the core "where is my order" view
function DeliveryTimeline({ delivery }) {
  const { markArrived, markDeparted, markDelivered } = useRetailerData()
  const events = delivery.events || []
  const isLast = (index) => index === events.length - 1

  return (
    <div className="delivery-timeline">
      {events.map((event, index) => {
        const isCurrent = isLast(index)
        const icon = EVENT_ICONS[event.status] || IconPaths.clock
        return (
          <div key={event.id} className="timeline-step">
            <div
              className="timeline-node"
              style={{
                background: isCurrent ? 'var(--gold-600)' : 'var(--border-soft)',
                color: isCurrent ? '#fff' : 'var(--ink-600)',
              }}
            >
              <Icon size={14}>{icon}</Icon>
            </div>
            <div className="timeline-line" />
            <div className="timeline-content">
              <div className="timeline-label">{event.label}</div>
              <div className="timeline-time">{event.time}</div>
              {event.location && <div className="timeline-location">{event.location}</div>}
            </div>
          </div>
        )
      })}

      {/* Action buttons — only show the next logical step */}
      <div className="timeline-actions">
        {delivery.status === 'in_transit' && (
          <button className="btn btn-primary" onClick={() => markArrived(delivery.id)}>
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.storefront}</Icon>
            Mark as arrived
          </button>
        )}
        {delivery.status === 'arrived' && (
          <button className="btn btn-primary" onClick={() => markDeparted(delivery.id)}>
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.truck}</Icon>
            Mark as departed
          </button>
        )}
        {delivery.status === 'departed' && (
          <button className="btn btn-primary" onClick={() => markDelivered(delivery.id)}>
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.check}</Icon>
            Mark as delivered
          </button>
        )}
      </div>
    </div>
  )
}

// Collapsible card for each delivery
function DeliveryCard({ delivery }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  const handleViewIncoming = () => {
    navigate('/dashboard/retailer/incoming', { state: { batchId: delivery.batchId } })
  }

  return (
    <div className="delivery-card">
      <div
        className="delivery-card-head"
        onClick={() => setExpanded((v) => !v)}
        style={{ cursor: 'pointer' }}
      >
        <div className="delivery-card-main">
          <span className="mono" style={{ fontSize: 12.5, background: 'var(--cream-100)', padding: '4px 8px', borderRadius: 6 }}>
            {delivery.id}
          </span>
          <div className="delivery-card-info">
            <div className="delivery-card-title">{delivery.cutType} · {delivery.packs} packs</div>
            <div className="delivery-card-sub">
              From {delivery.fromName} ({delivery.from}) · {delivery.vehicleRegistration} · {delivery.driverName}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DeliveryStatusPill status={delivery.status} />
          <Icon size={16} style={{ transition: 'transform 0.2s' }}>{expanded ? IconPaths.arrowLeft : IconPaths.arrowRight}</Icon>
        </div>
      </div>

      {expanded && (
        <div className="delivery-card-body">
          <div className="delivery-meta">
            <div className="meta-row">
              <span className="meta-label">Origin</span>
              <span className="meta-value">{delivery.origin}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Destination</span>
              <span className="meta-value">{delivery.destination}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Departure</span>
              <span className="meta-value">{delivery.departureTime}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">ETA</span>
              <span className="meta-value">{delivery.estimatedArrival}</span>
            </div>
            {delivery.arrivalTime && (
              <div className="meta-row">
                <span className="meta-label">Arrived</span>
                <span className="meta-value">{delivery.arrivalTime}</span>
              </div>
            )}
            {delivery.driverPhone && (
              <div className="meta-row">
                <span className="meta-label">Driver contact</span>
                <span className="meta-value">{delivery.driverPhone}</span>
              </div>
            )}
          </div>

          <div className="delivery-timeline-wrapper">
            <h4 style={{ margin: '0 0 12px', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-700)' }}>
              Tracking history
            </h4>
            <DeliveryTimeline delivery={delivery} />
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleViewIncoming}
              style={{ width: '100%' }}
            >
              <Icon size={14} style={{ marginRight: 6 }}>{IconPaths.storefront}</Icon>
              View in Incoming Batches
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DeliveryTrackingPage() {
  const navigate = useNavigate()
  const { deliveries, stats } = useRetailerData()
  const [filter, setFilter] = useState('all')

  const navigateToIncoming = (batchId) => {
    navigate('/dashboard/retailer/incoming', { state: { batchId } })
  }

  const filtered = deliveries.filter((d) => {
    if (filter === 'all') return true
    return d.status === filter
  })

  const inTransit = deliveries.filter((d) => d.status === 'in_transit')
  const arrived = deliveries.filter((d) => d.status === 'arrived')
  const departed = deliveries.filter((d) => d.status === 'departed' || d.status === 'delivered')

  return (
    <>
      <Panel
        title="Delivery tracking"
        action={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', 'in_transit', 'arrived', 'departed'].map((key) => (
              <button
                key={key}
                className="btn btn-outline"
                style={{
                  padding: '6px 14px',
                  fontSize: 12.5,
                  borderWidth: filter === key ? '2px' : '1.5px',
                  borderColor: filter === key ? 'var(--gold-600)' : 'var(--border-soft)',
                  color: filter === key ? 'var(--maroon-950)' : 'var(--ink-700)',
                }}
                onClick={() => setFilter(key)}
              >
                {key === 'all' ? 'All' : STATUS_CONFIG[key]?.label || key}
              </button>
            ))}
          </div>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 16px' }}>
          Track every batch from distributor to your store. Click a delivery to expand its full timeline and update its status.
        </p>

        <div className="stat-grid" style={{ marginBottom: 0 }}>
          <StatCard
            icon={IconPaths.truck}
            flagText="In transit"
            flagType="ok"
            value={stats.deliveriesInTransit}
            label="Batches in transit"
          />
          <StatCard
            icon={IconPaths.storefront}
            flagText="Arrived"
            flagType="ok"
            value={stats.deliveriesArrived}
            label="Batches arrived"
          />
          <StatCard
            icon={IconPaths.package}
            flagText="Done"
            flagType="ok"
            value={stats.deliveriesDeparted}
            label="Batches departed"
          />
          <StatCard
            icon={IconPaths.clock}
            flagText="Total"
            flagType="ok"
            value={deliveries.length}
            label="Tracked deliveries"
          />
        </div>
      </Panel>

      {/* In-transit summary */}
      {inTransit.length > 0 && (
        <Panel title="In transit" action={
          <a className="link" onClick={() => setFilter('in_transit')}>View all</a>
        }>
          {inTransit.map((d) => (
            <CareRow
              key={d.id}
              id={d.id}
              type={`${d.packs} packs · ${d.cutType} · From ${d.fromName}`}
              due={`ETA ${d.estimatedArrival}`}
              status="soon"
              label="In transit"
              onClick={() => navigateToIncoming(d.batchId)}
            />
          ))}
        </Panel>
      )}

      {/* Arrived summary */}
      {arrived.length > 0 && (
        <Panel title="Arrived at your store" action={
          <a className="link" onClick={() => setFilter('arrived')}>View all</a>
        }>
          {arrived.map((d) => (
            <CareRow
              key={d.id}
              id={d.id}
              type={`${d.packs} packs · ${d.cutType} · From ${d.fromName}`}
              due={`Arrived ${d.arrivalTime}`}
              status="ok"
              label="Arrived"
              onClick={() => navigateToIncoming(d.batchId)}
            />
          ))}
        </Panel>
      )}

      {/* Departed summary */}
      {departed.length > 0 && (
        <Panel title="Departed from your store" action={
          <a className="link" onClick={() => setFilter('departed')}>View all</a>
        }>
          {departed.map((d) => (
            <CareRow
              key={d.id}
              id={d.id}
              type={`${d.packs} packs · ${d.cutType} · From ${d.fromName}`}
              due={`Left ${d.departureFromRetailer || d.deliveredTime}`}
              status="ok"
              label={d.status === 'delivered' ? 'Delivered' : 'Departed'}
              onClick={() => navigateToIncoming(d.batchId)}
            />
          ))}
        </Panel>
      )}

      {/* Full delivery list with expandable timelines */}
      <Panel title="All deliveries">
        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 16px' }}>
          {filtered.length === 0
            ? 'No deliveries match the selected filter.'
            : `${filtered.length} deliver${filtered.length === 1 ? 'y' : 'ies'} shown.`}
        </p>
        {filtered.length === 0 && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>No deliveries to show right now.</p>
        )}
        {filtered.map((delivery) => (
          <DeliveryCard key={delivery.id} delivery={delivery} />
        ))}
      </Panel>
    </>
  )
}

export default DeliveryTrackingPage
