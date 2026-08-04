import { useState } from 'react'
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardShell } from '../../components/DashboardShell'
import { DashHead } from '../../components/DashHead'
import { NoteBanner, StatCard, Panel, CareRow, ActivityItem, InventoryRow } from '../../components/DashboardBits'
import { Icon, IconPaths } from '../../components/icons'
import { RetailerDataProvider, useRetailerData } from './components/RetailerDataContext'
import { IncomingBatchesPage, InventoryPage, VerifyProductPage, SalesPage, NotificationsPage } from './RetailerPages'
import { DeliveryTrackingPage } from './DeliveryTrackingPage'
import { SetupProfilePage } from './SetupProfilePage'
import { RetailerReviewsPage, RetailerReportsPage } from '../FeedbackPages'


const navItems = [
  { label: 'Dashboard', icon: IconPaths.grid, active: true, path: '/dashboard/retailer' },
  { label: 'Incoming batches', icon: IconPaths.storefront, path: '/dashboard/retailer/incoming' },
  { label: 'Shelf inventory', icon: IconPaths.boxes, path: '/dashboard/retailer/inventory' },
  { label: 'Delivery tracking', icon: IconPaths.truck, path: '/dashboard/retailer/delivery' },
  { label: 'Verify product', icon: IconPaths.qr, path: '/dashboard/retailer/verify' },
  { label: 'Sales', icon: IconPaths.sales, path: '/dashboard/retailer/sales' },
  { label: 'Notifications', icon: IconPaths.bell, path: '/dashboard/retailer/notifications' },
  { label: 'Reviews', icon: IconPaths.check, path: '/dashboard/retailer/reviews' },
  { label: 'Reports', icon: IconPaths.alert, path: '/dashboard/retailer/reports' },
  { label: 'Setup Profile', icon: IconPaths.fileText, path: '/dashboard/retailer/setup' },
  { label: 'Profile', icon: IconPaths.profile, path: '/dashboard/retailer/profile' },
  { label: 'Settings', icon: IconPaths.gear, path: '/dashboard/retailer/settings' },
]

// Turns a stored user id into a stable, readable actor id like "RT-000019".
function actorIdFromUser(user) {
  if (!user) return 'RT-000000'
  if (user.actorId) return user.actorId
  const digits = String(user.id).replace(/\D/g, '').slice(-6).padStart(6, '0')
  return `RT-${digits}`
}

function RetailerHome({ user }) {
  const navigate = useNavigate()
  const { incomingBatches, inventory, notifications, stats, deliveries } = useRetailerData()

  const pendingBatches = incomingBatches.filter((batch) => batch.status === 'pending')
  const recentIncoming = incomingBatches.slice(0, 2)
  const recentInventory = inventory.slice(0, 4)
  const recentCustomerScans = notifications.filter((note) => note.type === 'scan').slice(0, 2)
  // FIX: the context provides `deliveries`, not `inTransitShipments` — that
  // field never existed, so reading `.length` off it would crash. Derive
  // the in-transit list from the real data instead.
  const inTransitShipments = deliveries.filter((delivery) => delivery.status === 'in_transit')

  return (
    <>
      <DashHead
        greeting={`HELLO, ${user?.firstName || user?.contactFirstName || 'Retailer'}!`}
        title="Dashboard"
        subtitle="What's arrived, what's on the shelf, and what still needs verifying."
        actions={
          <>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard/retailer/incoming')}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.plus}</Icon>
              Receive batch
            </button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard/retailer/verify')}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.qr}</Icon>
              Verify with QR / RFID
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard/retailer/setup')}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.fileText}</Icon>
              Setup Profile
            </button>
          </>
        }
      />
      {pendingBatches.length > 0 && (
        <NoteBanner>
          <b>{pendingBatches.length} incoming batch{pendingBatches.length === 1 ? '' : 'es'}</b> still need verification before they can be shelved.
        </NoteBanner>
      )}

      <div className="stat-grid">
        <StatCard
          icon={IconPaths.storefront}
          flagText="Received"
          value={stats.batchesReceivedToday}
          label="Batches received today"
          onClick={() => navigate('/dashboard/retailer/incoming')}
        />

        <StatCard
          icon={IconPaths.boxes}
          flagText="In stock"
          value={stats.itemsOnShelf}
          label="Items on shelf"
          onClick={() => navigate('/dashboard/retailer/inventory')}
        />

        <StatCard
          icon={IconPaths.qr}
          flagText="Needs check"
          flagType="attn"
          value={stats.pendingVerification}
          label="Pending verification"
          onClick={() => navigate('/dashboard/retailer/verify')}
        />

        <StatCard
          icon={IconPaths.sales}
          flagText="Today"
          value={stats.unitsSoldToday}
          label="Units sold today"
          onClick={() => navigate('/dashboard/retailer/sales')}
        />
      </div>

      <div className="grid-2col">
        <div>
          {inTransitShipments.length > 0 && (
            <Panel title="On the way from your distributor">
              {inTransitShipments.map((shipment) => (
                <CareRow
                  key={shipment.id}
                  id={shipment.id}
                  type={`${shipment.packs} packs · ${shipment.cutType} · From ${shipment.fromName || shipment.from || 'Distributor'}`}
                  due={shipment.estimatedArrival ? `ETA ${shipment.estimatedArrival}` : 'In transit'}
                  status="soon"
                  label="In transit"
                />
              ))}
            </Panel>
          )}

          <Panel
            title="Incoming batches"
            action={
              <a className="link" onClick={() => navigate('/dashboard/retailer/incoming')}>
                View all
              </a>
            }
          >
            {recentIncoming.length === 0 && <p style={{ fontSize: 13.5, color: 'var(--ink-600)', margin: 0 }}>No batches are waiting right now.</p>}
            {recentIncoming.map((batch) => (
              <CareRow
                key={batch.id}
                id={batch.id}
                type={`${batch.packs} packs · From ${batch.from}`}
                due={batch.status === 'verified' ? 'Verified and shelved' : 'Awaiting verification'}
                status={batch.status === 'verified' ? 'ok' : 'soon'}
                label={batch.status === 'verified' ? 'Verified' : 'Needs check'}
                onClick={() => navigate('/dashboard/retailer/verify')}
              />
            ))}
          </Panel>

          <Panel
            title="Recent customer scans"
            action={
              <a className="link" onClick={() => navigate('/dashboard/retailer/notifications')}>
                View all
              </a>
            }
          >
            {recentCustomerScans.length === 0 && <p style={{ fontSize: 13.5, color: 'var(--ink-600)', margin: 0 }}>No customer scans yet.</p>}
            {recentCustomerScans.map((note) => (
              <ActivityItem key={note.id} text={note.text} time={note.time} />
            ))}
          </Panel>
        </div>

        <div>
          <Panel
            title="Shelf inventory"
            action={
              <a className="link" onClick={() => navigate('/dashboard/retailer/inventory')}>
                Manage
              </a>
            }
          >
            {recentInventory.map((item) => (
              <InventoryRow key={item.id} icon={IconPaths.boxes} name={item.name} sub={item.lotId ? `Lot ${item.lotId}` : item.counter} count={`${item.packs} packs`} />
            ))}
          </Panel>
        </div>
      </div>
    </>
  )
}

function RetailerProfilePage({ user, onUpdateUser }) {
  // Build the profile shown/edited here straight from the signed-up account,
  // instead of hardcoded placeholder values.
  function profileFromUser(currentUser) {
    const location = [currentUser?.address, currentUser?.county].filter(Boolean).join(', ')
    return {
      store: currentUser?.shopName || currentUser?.storeName || currentUser?.name || 'Your store',
      role: 'Retailer',
      actorId: actorIdFromUser(currentUser),
      contact: currentUser?.email || currentUser?.phone || '',
      location: location || currentUser?.location || '',
      license: currentUser?.tradingLicenseNumber || '',
    }
  }

  const profile = profileFromUser(user)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(profile)

  function handleEditStart() {
    setDraft(profile)
    setIsEditing(true)
  }

  function handleCancel() {
    setDraft(profile)
    setIsEditing(false)
  }

  function handleSave() {
    setIsEditing(false)

    if (onUpdateUser && user) {
      const isEmail = draft.contact.includes('@')
      onUpdateUser({
        ...user,
        storeName: draft.store,
        location: draft.location,
        actorId: draft.actorId,
        ...(isEmail ? { email: draft.contact } : { phone: draft.contact }),
      })
    }
  }

  return (
    <Panel
      title="Retailer details"
      action={
        !isEditing ? (
          <button type="button" className="btn btn-primary" onClick={handleEditStart}>
            Edit profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-outline" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          </div>
        )
      }
    >
      {isEditing ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 13.5 }}>
            <span style={{ color: 'var(--ink-600)' }}>Store</span>
            <input
              value={draft.store}
              onChange={(event) => setDraft((current) => ({ ...current, store: event.target.value }))}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13.5 }}>
            <span style={{ color: 'var(--ink-600)' }}>Role</span>
            <input
              value={draft.role}
              onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13.5 }}>
            <span style={{ color: 'var(--ink-600)' }}>Actor ID</span>
            <input
              value={draft.actorId}
              onChange={(event) => setDraft((current) => ({ ...current, actorId: event.target.value }))}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13.5 }}>
            <span style={{ color: 'var(--ink-600)' }}>Contact</span>
            <input
              value={draft.contact}
              onChange={(event) => setDraft((current) => ({ ...current, contact: event.target.value }))}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 13.5 }}>
            <span style={{ color: 'var(--ink-600)' }}>Location</span>
            <input
              value={draft.location}
              onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
              style={inputStyle}
            />
          </label>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10, fontSize: 14, color: 'var(--ink-700)' }}>
          <div><strong>Store:</strong> {profile.store}</div>
          <div><strong>Role:</strong> {profile.role}</div>
          <div><strong>Actor ID:</strong> {profile.actorId}</div>
          <div><strong>Contact:</strong> {profile.contact || '—'}</div>
          <div><strong>Location:</strong> {profile.location || '—'}</div>
          {profile.license && <div><strong>Trading license:</strong> {profile.license}</div>}
        </div>
      )}
    </Panel>
  )
}

const inputStyle = {
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid var(--border-soft)',
  background: 'var(--page-bg)',
  color: 'var(--ink-900)',
  fontSize: 13.5,
}

export function RetailerDashboard({ user, onUpdateUser, onLogout, onToggleTheme }) {
  const navigate = useNavigate()

  function handleLogout() {
    if (onLogout) onLogout()
    navigate('/login')
  }

  return (
    <RetailerDataProvider retailerId={user?.id}>
      <DashboardShell
        roleLabel="RETAILER"
        actorId={actorIdFromUser(user)}
        greeting={`Good morning, ${user?.firstName || user?.contactFirstName || 'Retailer'}!`}
        name={user?.shopName || user?.storeName || user?.store || user?.name || 'Your store'}
        navItems={navItems}
        onLogout={handleLogout}
        onToggleTheme={onToggleTheme}
        profilePath="/dashboard/retailer/profile"
      >
        <Routes>
          <Route index element={<RetailerHome user={user} />} />
          <Route path="incoming" element={<IncomingBatchesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="delivery" element={<DeliveryTrackingPage />} />
          <Route path="verify" element={<VerifyProductPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="reviews" element={<RetailerReviewsPage />} />
          <Route path="reports" element={<RetailerReportsPage />} />
          <Route path="setup" element={<SetupProfilePage user={user} />} />
          <Route path="profile" element={<RetailerProfilePage user={user} onUpdateUser={onUpdateUser} />} />
          <Route
            path="settings"
            element={
              <Panel title="Settings">
                <p style={{ fontSize: 13.5, color: 'var(--ink-600)', margin: 0 }}>
                  Account and store settings will live here.
                </p>
              </Panel>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard/retailer" replace />} />
        </Routes>
      </DashboardShell>
    </RetailerDataProvider>
  )
}
