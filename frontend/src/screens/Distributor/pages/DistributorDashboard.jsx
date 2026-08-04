import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { DistributorShell } from '../components/DistributorShell'
import { DashHead } from '../../../components/DashHead'
import { NoteBanner, StatCard, Panel, CareRow, ActivityItem, InventoryRow } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useDistributorData } from '../context/useDistributorData'
import { formatDueLabel, formatActivityTime } from '../context/distributorDataUtils'
import { activityContent } from '../context/Activitycontent'
import { ProfileSetupWizard, STEP_LABELS } from './ProfileSetupWizard'
import { ProfileView } from './ProfileView'
import { ReceiveShipmentContent } from './ReceiveShipment'
import { ScheduleDeliveryContent } from './ScheduleDelivery'
import { WarehouseInventoryContent } from './WarehouseInventory'
import { RecentContent } from './Recent'

const SHIPMENT_HISTORY_ANCHOR = 'shipment-history-table'

function DistributorHome({ fullname }) {
  const navigate = useNavigate()
  const {
    totalWarehouseCount,
    warehouseItems,
    shipmentRequests,
    pendingShipmentRequests,
    shipmentsToday,
    inTransitDeliveries,
    deliveriesCompletedToday,
    recentActivity,
    profile,
    profileComplete,
    completeProfileSetup,
    updateProfile,
    completeDelivery,
  } = useDistributorData()
  const [profileModal, setProfileModal] = useState(null)
  const [wizardStep, setWizardStep] = useState(1)

  const handleStepClick = (stepNumber) => {
    setWizardStep(stepNumber)
    setProfileModal('wizard')
  }

  const recentlyAdded = [...shipmentRequests]
    .filter((s) => s.status === 'accepted')
    .sort((a, b) => (b.resolvedAt || 0) - (a.resolvedAt || 0))
    .slice(0, 3)

  const goToShipmentHistory = (e) => {
    e.preventDefault()
    navigate(`/dashboard/distributor/receive-shipment#${SHIPMENT_HISTORY_ANCHOR}`)
  }

  const goToRecentActivity = (e) => {
    e.preventDefault()
    navigate('/dashboard/distributor/recent')
  }

  return (
    <>
      <DashHead
        greeting={`Hello, ${fullname}!`}
        title="Dashboard"
        subtitle="This is the Warehouse stock and delivery status across your routes."
        actions={
          <>
            <button
              className="btn btn-outline"
              onClick={() => navigate('/dashboard/distributor/receive-shipment')}
            >
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.plus}</Icon>Receive shipment
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard/distributor/schedule-delivery')}
            >
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.schedule}</Icon>Schedule delivery
            </button>
          </>
        }
      />

      {!profileComplete && (
        <NoteBanner>
          Your distributor profile isn't set up yet.{' '}
          <a href="#" className="link" onClick={(e) => { e.preventDefault(); setWizardStep(1); setProfileModal('wizard') }}>
            <b>Set up your profile</b>
          </a>
          {' '}to unlock full warehouse customization, including your own storage bays.
        </NoteBanner>
      )}

      <Panel title="Profile setup">
        <p className="db-checklist-hint">
          {profileComplete
            ? 'Jump straight to any section to make changes.'
            : 'Click a step to jump straight to it and fill it in.'}
        </p>
        <div className="db-checklist">
          {STEP_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              className="db-checklist-item"
              onClick={() => handleStepClick(i + 1)}
            >
              <span className="db-checklist-num">{i + 1}</span>
              {label}
            </button>
          ))}
        </div>
      </Panel>

      {shipmentsToday.length > 0 ? (
        <NoteBanner>
          <b>{shipmentsToday.length}</b> shipment{shipmentsToday.length === 1 ? '' : 's'} {shipmentsToday.length === 1 ? 'is' : 'are'} expected today at the Ruiru warehouse.
        </NoteBanner>
      ) : (
        <NoteBanner>No shipments are expected today.</NoteBanner>
      )}

      <div className="stat-grid">
        <StatCard icon={IconPaths.boxes} flagText="In stock" value={totalWarehouseCount} label="Items in warehouse" />
        <StatCard icon={IconPaths.warehouse} flagText="Awaiting receipt" flagType="attn" value={pendingShipmentRequests.length} label="Pending shipment requests" />
        <StatCard icon={IconPaths.warehouse} flagText="In transit" value={inTransitDeliveries.length} label="Deliveries in transit" />
        <StatCard icon={IconPaths.sales} flagText="Today" value={deliveriesCompletedToday} label="Deliveries completed today" />
      </div>

      <div className="grid-2col">
        <div>
          <Panel title="Incoming shipments" action={<a href="#" className="link" onClick={goToShipmentHistory}>View all</a>}>
            {recentlyAdded.length === 0 ? (
              <p className="db-empty">No shipments added yet.</p>
            ) : (
              recentlyAdded.map((shipment) => (
                <CareRow
                  key={shipment.id}
                  id={shipment.id}
                  type={`${shipment.packs} packs · From ${shipment.from}`}
                  due={formatDueLabel(shipment.date, shipment.time, 'Added')}
                  status="ok"
                  label="Added"
                />
              ))
            )}
          </Panel>

          <Panel title="Recent activity" action={<a href="#" className="link" onClick={goToRecentActivity}>View all</a>}>
            {recentActivity.length === 0 ? (
              <p className="db-empty">No activity yet.</p>
            ) : (
              recentActivity.map((entry) => (
                <ActivityItem key={entry.id} text={activityContent(entry)} time={formatActivityTime(entry.timestamp)} />
              ))
            )}
          </Panel>
        </div>

        <div>
          <Panel title="Deliveries in transit" action={<a href="#" className="link" onClick={(e) => { e.preventDefault(); navigate('/dashboard/distributor/schedule-delivery') }}>Track all</a>}>
            {inTransitDeliveries.length === 0 ? (
              <p className="db-empty">No deliveries currently in transit.</p>
            ) : (
              inTransitDeliveries.map((delivery) => (
                <div key={delivery.id} className="db-delivery-row">
                  <CareRow
                    id={delivery.id}
                    type={`${delivery.packs} packs → ${delivery.to}`}
                    due={formatDueLabel(delivery.date, delivery.time, 'En route · ETA')}
                    status="ok"
                    label="En route"
                  />
                  <button className="btn btn-outline db-mark-delivered" onClick={() => completeDelivery(delivery.id)}>
                    Mark delivered
                  </button>
                </div>
              ))
            )}
          </Panel>

          <Panel title="Warehouse inventory" action={<a href="#" className="link" onClick={(e) => { e.preventDefault(); navigate('/dashboard/distributor/warehouse-inventory') }}>Manage</a>}>
            {warehouseItems.length === 0 ? (
              <p className="db-empty">Warehouse is currently empty.</p>
            ) : (
              warehouseItems.map((item) => (
                <InventoryRow key={item.id} icon={IconPaths.boxes} name={item.name} sub={item.sub} count={`${item.count} packs`} />
              ))
            )}
          </Panel>
        </div>
      </div>

      {profileModal === 'view' && (
        <ProfileView
          profile={profile}
          onClose={() => setProfileModal(null)}
          onEdit={() => { setWizardStep(1); setProfileModal('wizard') }}
        />
      )}

      {profileModal === 'wizard' && (
        <ProfileSetupWizard
          initialData={profileComplete ? profile : null}
          initialStep={wizardStep}
          onClose={() => setProfileModal(null)}
          onComplete={(data) => {
            if (profileComplete) {
              updateProfile(data)
            } else {
              completeProfileSetup(data)
            }
            setProfileModal(null)
          }}
        />
      )}

      <style>{`
        .db-checklist-hint {
          margin: 0 0 12px;
          font-size: 0.85rem;
          color: var(--text-muted, #5a6570);
        }

        .db-checklist {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .db-checklist-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px 7px 8px;
          border-radius: 999px;
          border: 1px solid var(--border-color, #dfe4ea);
          background: var(--surface-color, #ffffff);
          color: var(--text-color, #1f2933);
          font-size: 0.85rem;
          cursor: pointer;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .db-checklist-item:hover {
          border-color: var(--accent-color, #1c6f5d);
          background: var(--accent-color-soft, #e4f2ee);
        }

        .db-checklist-item:focus-visible {
          outline: 2px solid var(--accent-color, #1c6f5d);
          outline-offset: 1px;
        }

        .db-checklist-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--surface-muted, #f6f8fa);
          color: var(--text-muted, #5a6570);
          font-size: 0.72rem;
          font-weight: 700;
        }

        [data-theme='dark'] .db-checklist-item {
          border-color: #333d47;
          background: #1b222b;
          color: #e7ebef;
        }

        [data-theme='dark'] .db-checklist-item:hover {
          border-color: #4fbf9f;
          background: rgba(79, 191, 159, 0.14);
        }

        [data-theme='dark'] .db-checklist-num {
          background: #222a34;
          color: #99a4b0;
        }

        .db-empty {
          color: var(--text-muted, #5a6570);
          padding: 8px 0;
        }

        .db-delivery-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .db-mark-delivered {
          font-size: 0.82rem;
          padding: 6px 12px;
          white-space: nowrap;
        }
      `}</style>
    </>
  )
}

export function DistributorDashboard({ onLogout, onToggleTheme }) {
  const navigate = useNavigate()
  const { profile } = useDistributorData()
  const fullname = profile?.contact?.fullName || profile?.company?.distributorName || 'Distributor'

  return (
    <DistributorShell fullname={fullname} onLogout={onLogout} onToggleTheme={onToggleTheme}>
      <Routes>
        <Route index element={<DistributorHome fullname={fullname} />} />
        <Route path="receive-shipment" element={<ReceiveShipmentContent />} />
        <Route path="schedule-delivery" element={<ScheduleDeliveryContent />} />
        <Route path="warehouse-inventory" element={<WarehouseInventoryContent />} />
        <Route path="recent" element={<RecentContent />} />
        <Route path="profile" element={
          profile ? (
            <ProfileView
              profile={profile}
              onClose={() => navigate('/dashboard/distributor')}
              onEdit={() => navigate('/dashboard/distributor')}
            />
          ) : (
            <Panel title="Profile not set up">
              <p style={{ fontSize: 13.5, color: 'var(--ink-600)', margin: '0 0 16px' }}>
                Your distributor profile hasn't been created yet. Complete setup to view your details.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/dashboard/distributor')}
              >
                Set up profile
              </button>
            </Panel>
          )
        } />
      </Routes>
    </DistributorShell>
  )
}
