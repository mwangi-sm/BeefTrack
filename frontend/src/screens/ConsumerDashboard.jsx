import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { emitCustomerScan } from '../lib/eventBus'
import { DashboardShell } from '../components/DashboardShell'
import { StatCard, Panel } from '../components/DashboardBits'
import { Icon, IconPaths } from '../components/icons'

const chainSteps = [
  { who: 'Farm', label: 'Kiambu Highlands' },
  { who: 'Agent', label: 'AG-000123' },
  { who: 'Transport', label: 'TP-000045' },
  { who: 'Abattoir', label: 'SH-000012' },
  { who: 'Processor', label: 'PR-000027' },
  { who: 'Distributor', label: 'DT-000015' },
  { who: 'Retailer', label: 'Greenview Butchery' },
  { who: 'You', label: 'Verified authentic', done: true },
]

const createMockData = (user) => {
  const baseName =
    user?.fullname || user?.full_name || user?.name ||
    (user?.firstName || user?.lastName ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : '') ||
    'Amina Yusuf'
  return {
    profile: {
      name: baseName || 'Amina Yusuf',
      email: user?.email || 'amina@example.com',
      phone: user?.phone || '+254 712 345 678',
      memberSince: 'March 2024',
      trustScore: '96%',
      address: 'Nairobi, Kenya',
    },
    notifications: [
      { id: 'n1', title: 'Recent scan verified', body: 'LOT-000078 is now fully verified and linked to the farm record.', time: '2 min ago', unread: true },
    ],
    scanHistory: [
      { id: 'LOT-000078', product: 'Sirloin cuts, pack #4', location: 'Kiambu Highlands Farm', time: 'Scanned today', status: 'Verified' },
    ],
    reviews: [
      { id: 'r1', title: 'Clear traceability', body: 'The QR journey made it simple to verify the origin of this pack.', rating: 5 },
    ],
    concerns: [
      { id: 'c1', title: 'Packaging label was hard to read', detail: 'The retail label was slightly smudged at the point of sale.', status: 'Open' },
    ],
  }
}

export function ConsumerDashboard({ onLogout, onToggleTheme, user }) {
  const mockData = useMemo(() => createMockData(user), [user])
  const [activeView, setActiveView] = useState('home')
  const [notifications, setNotifications] = useState(() => mockData.notifications)
  const [scanHistory, setScanHistory] = useState(() => mockData.scanHistory)
  const [reviews] = useState(() => mockData.reviews)
  const [concerns, setConcerns] = useState(() => mockData.concerns)
  const [selectedScanId, setSelectedScanId] = useState(() => mockData.scanHistory[0]?.id)
  const [selectedReviewId, setSelectedReviewId] = useState(() => mockData.reviews[0]?.id)
  const [selectedConcernId, setSelectedConcernId] = useState(() => mockData.concerns[0]?.id)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraMessage, setCameraMessage] = useState('Open your camera to scan a BeefTrace QR label.')
  const [concernText, setConcernText] = useState('')
  const videoRef = useRef(null)

  const [profile] = useState(() => mockData.profile)

  const selectedScan = scanHistory.find((item) => item.id === selectedScanId) || scanHistory[0]
  const selectedReview = reviews.find((item) => item.id === selectedReviewId) || reviews[0]
  const selectedConcern = concerns.find((item) => item.id === selectedConcernId) || concerns[0]

  useEffect(() => {
    if (!cameraOpen) return undefined

    let stream = null
    let active = true

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraMessage('Camera access is unavailable in this browser, so the scanner is running in mock mode.')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!active || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraMessage('Camera ready. Point it at a BeefTrace label to verify the source.')
      } catch {
        setCameraMessage('Camera permission was blocked, so the scanner is running in mock mode.')
      }
    }

    startCamera()

    return () => {
      active = false
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraOpen])

  const navItems = [
    { label: 'Home', icon: IconPaths.grid, active: activeView === 'home', onSelect: () => setActiveView('home') },
    { label: 'Scan a product', icon: IconPaths.qr, active: activeView === 'scanner', onSelect: () => setActiveView('scanner') },
    { label: 'Scan history', icon: IconPaths.clock, active: activeView === 'scan-history', onSelect: () => setActiveView('scan-history') },
    { label: 'Reviews', icon: IconPaths.star, active: activeView === 'reviews', onSelect: () => setActiveView('reviews') },
    { label: 'Report a concern', icon: IconPaths.alert, active: activeView === 'report-concern', onSelect: () => setActiveView('report-concern') },
    { label: 'Notifications', icon: IconPaths.bell, active: activeView === 'notifications', onSelect: () => setActiveView('notifications') },
    { label: 'Profile', icon: IconPaths.profile, active: activeView === 'profile', onSelect: () => setActiveView('profile') },
  ]

  const handleNotificationToggle = () => {
    setActiveView((current) => (current === 'notifications' ? 'home' : 'notifications'))
  }

  const handleProfileToggle = () => {
    setActiveView((current) => (current === 'profile' ? 'home' : 'profile'))
  }

  const handleCompleteScan = () => {
    const nextScan = {
      id: `LOT-${Math.floor(100000 + Math.random() * 900000)}`,
      product: 'Sirloin cuts, pack #4',
      location: 'Kiambu Highlands Farm',
      time: 'Scanned just now',
      status: 'Verified',
    }

    setScanHistory((current) => [nextScan, ...current])
    setSelectedScanId(nextScan.id)
    setNotifications((current) => [
      { id: `n${Date.now()}`, title: 'QR scan captured', body: `Your scan for ${nextScan.product} is ready to review.`, time: 'Just now', unread: true },
      ...current,
    ])
    setActiveView('scan-history')
    setCameraOpen(false)

    // Broadcast the scan so retailers can receive a customer-scan notification
    try {
      emitCustomerScan({ lot: nextScan.id, packNumber: 1, customer: profile.name })
    } catch {
      // ignore bus errors in mock mode
    }
  }

  const handleSubmitConcern = (event) => {
    event.preventDefault()
    if (!concernText.trim()) return

    const nextConcern = {
      id: `c${Date.now()}`,
      title: 'New concern reported',
      detail: concernText.trim(),
      status: 'Open',
    }

    setConcerns((current) => [nextConcern, ...current])
    setSelectedConcernId(nextConcern.id)
    setConcernText('')
    setActiveView('report-concern')
  }

  const stats = [
    { icon: IconPaths.qr, flagText: 'All time', value: scanHistory.length, label: 'Products scanned' },
    { icon: IconPaths.check, flagText: 'Verified', value: scanHistory.filter((item) => item.status === 'Verified').length, label: 'Confirmed authentic' },
    { icon: IconPaths.farm, flagText: 'Discovered', value: 1, label: 'Farms traced' },
  ]

  const renderHomeView = () => (
    <>
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Welcome back, {profile.name.split(' ')[0]}</p>
          <h1>Home</h1>
          <p className="sub">Scan a product to see exactly where it came from and review the journey in one place.</p>
        </div>
      </div>

      <div
        className="panel"
        style={{
          background: 'linear-gradient(120deg, var(--maroon-950), var(--maroon-700))',
          border: 'none',
          color: 'var(--cream-50)',
          textAlign: 'center',
          padding: '38px 24px',
        }}
      >
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(247,242,231,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon size={26} style={{ color: 'var(--gold-400)' }}>{IconPaths.qr}</Icon>
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 600 }}>Scan a QR code</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'rgba(247,242,231,0.75)' }}>
          Open the scanner to verify the beef’s journey from the farm to your table.
        </p>
        <button className="btn btn-primary" style={{ padding: '13px 30px' }} onClick={() => setActiveView('scanner')}>Open scanner</button>
      </div>

      <div style={{ marginTop: 14 }}>
        <Panel title="Retailer" action={<button type="button" className="link" onClick={() => setActiveView('retailer-profile')}>View profile</button>}>
          <div className="consumer-detail-card">
            <h4>{chainSteps.find((s) => s.who === 'Retailer')?.label || 'Retailer'}</h4>
            <p style={{ margin: 0 }}>Contact the retailer for stock or product questions.</p>
          </div>
        </Panel>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 22 }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} flagText={stat.flagText} value={stat.value} label={stat.label} />
        ))}
      </div>

      <div className="grid-2col" style={{ marginTop: 8 }}>
        <div>
          <Panel title="Recent scans" action={<button type="button" className="link" onClick={() => setActiveView('scan-history')}>View all</button>}>
            {scanHistory.map((item) => (
              <div key={item.id} className="consumer-list-row" onClick={() => { setSelectedScanId(item.id); setActiveView('scan-history') }}>
                <span className="mono">{item.id}</span>
                <div className="meta">
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.product}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-600)' }}>{item.time}</div>
                </div>
                <span className={`status-pill status-ok`}>{item.status}</span>
              </div>
            ))}
          </Panel>

          <Panel title="Quick actions">
            <div className="consumer-action-card" onClick={() => setActiveView('scan-history')}>
              <div>
                <div className="title">Open scan history</div>
                <div className="desc">Review the latest products you verified.</div>
              </div>
              <Icon>{IconPaths.clock}</Icon>
            </div>
            <div className="consumer-action-card" onClick={() => setActiveView('notifications')}>
              <div>
                <div className="title">View notifications</div>
                <div className="desc">Stay updated on your latest scans and account changes.</div>
              </div>
              <Icon>{IconPaths.bell}</Icon>
            </div>
            <div className="consumer-action-card" onClick={() => setActiveView('report-concern')}>
              <div>
                <div className="title">Report a concern</div>
                <div className="desc">Share a problem with a package or verification issue.</div>
              </div>
              <Icon>{IconPaths.alert}</Icon>
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Full journey — LOT-000078">
            <p style={{ fontSize: 12.5, color: 'var(--ink-600)', margin: '0 0 4px' }}>
              Sirloin cuts, pack #4 · From Kiambu Highlands Farm
            </p>
            <div className="mini-chain">
              {chainSteps.map((step, i) => (
                <Fragment key={step.who}>
                  <div className="mini-chain-node">
                    <div className="dot" style={step.done ? { background: 'var(--sage-600)' } : undefined}></div>
                    <span className="who">{step.who}</span>
                    <p>{step.label}</p>
                  </div>
                  {i < chainSteps.length - 1 && <div className="mini-chain-line"></div>}
                </Fragment>
              ))}
            </div>
          </Panel>

          <Panel title="Latest review" action={<button type="button" className="link" onClick={() => setActiveView('reviews')}>Open</button>}>
            <div className="consumer-detail-card">
              <h4>{selectedReview.title}</h4>
              <p>{selectedReview.body}</p>
              <p style={{ fontWeight: 600 }}>Rating: {selectedReview.rating}/5</p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )

  const renderNotificationsView = () => (
    <>
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Your updates</p>
          <h1>Notifications</h1>
          <p className="sub">Recent updates tied to your scan activity.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => setActiveView('home')}>Back home</button>
      </div>
      <div className="panel">
        {notifications.map((item) => (
          <div key={item.id} className="consumer-action-card" style={{ marginBottom: 12 }}>
            <div>
              <div className="title">{item.title}</div>
              <div className="desc">{item.body}</div>
            </div>
            <span className="mono">{item.time}</span>
          </div>
        ))}
      </div>
    </>
  )

  const renderProfileView = () => (
    <>
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Profile</p>
          <h1>{profile.name}</h1>
          <p className="sub">Your account details and trust status.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => setActiveView('home')}>Back home</button>
      </div>
      <div className="panel screen-surface">
        <div className="consumer-detail-card">
          <h4>Profile details</h4>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Phone:</strong> {profile.phone}</p>
          <p><strong>Address:</strong> {profile.address}</p>
          <p><strong>Member since:</strong> {profile.memberSince}</p>
          <p><strong>Trust score:</strong> {profile.trustScore}</p>
        </div>
      </div>
    </>
  )

  const renderScanHistoryView = () => (
    <>
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Traceability</p>
          <h1>Scan history</h1>
          <p className="sub">Tap any entry to focus the history card.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => setActiveView('home')}>Back home</button>
      </div>
      <div className="grid-2col">
        <Panel title="Saved scans">
          {scanHistory.map((item) => (
            <div key={item.id} className="consumer-list-row" onClick={() => setSelectedScanId(item.id)}>
              <span className="mono">{item.id}</span>
              <div className="meta">
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.product}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-600)' }}>{item.location}</div>
              </div>
              <span className={`status-pill status-ok`}>{item.status}</span>
            </div>
          ))}
        </Panel>
        <Panel title={selectedScan?.product || 'Selected scan'}>
          <div className="consumer-detail-card">
            <h4>{selectedScan?.product}</h4>
            <p>{selectedScan?.location}</p>
            <p><strong>Time:</strong> {selectedScan?.time}</p>
            <p><strong>Status:</strong> {selectedScan?.status}</p>
          </div>
        </Panel>
      </div>
    </>
  )

  const renderReviewsView = () => (
    <>
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Feedback</p>
          <h1>Reviews</h1>
          <p className="sub">One example review and the details behind it.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => setActiveView('home')}>Back home</button>
      </div>
      <div className="grid-2col">
        <Panel title="Saved reviews">
          {reviews.map((item) => (
            <div key={item.id} className="consumer-list-row" onClick={() => setSelectedReviewId(item.id)}>
              <div className="meta">
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-600)' }}>{item.rating}/5 stars</div>
              </div>
              <span className="mono">{item.id}</span>
            </div>
          ))}
        </Panel>
        <Panel title={selectedReview?.title || 'Selected review'}>
          <div className="consumer-detail-card">
            <h4>{selectedReview?.title}</h4>
            <p>{selectedReview?.body}</p>
            <p><strong>Rating:</strong> {selectedReview?.rating}/5</p>
          </div>
        </Panel>
      </div>
    </>
  )

  const renderConcernView = () => (
    <>
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Support</p>
          <h1>Report a concern</h1>
          <p className="sub">Share what went wrong and a support agent will review it.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => setActiveView('home')}>Back home</button>
      </div>
      <div className="grid-2col">
        <Panel title="New report">
          <form onSubmit={handleSubmitConcern}>
            <div className="field">
              <label>What happened?</label>
              <textarea value={concernText} onChange={(event) => setConcernText(event.target.value)} placeholder="Describe the packaging issue or verification problem" rows="5" style={{ width: '100%', borderRadius: 10, border: '1.5px solid var(--border-soft)', padding: '11px 14px', background: 'var(--page-bg)', color: 'var(--ink-900)' }} />
            </div>
            <button type="submit" className="btn btn-primary">Submit concern</button>
          </form>
        </Panel>
        <Panel title="Existing concern">
          <div className="consumer-detail-card">
            <h4>{selectedConcern?.title}</h4>
            <p>{selectedConcern?.detail}</p>
            <p><strong>Status:</strong> {selectedConcern?.status}</p>
          </div>
        </Panel>
      </div>
    </>
  )

  const renderScannerView = () => (
    <>
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Scanner</p>
          <h1>Scan a product</h1>
          <p className="sub">Open the camera to scan the product label and confirm the journey.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => setActiveView('home')}>Back home</button>
      </div>
      <div className="grid-2col">
        <Panel title="Camera scanner">
          <div className="viewer-box">
            {cameraOpen ? <video ref={videoRef} playsInline muted /> : <div className="placeholder">Camera is off. Tap below to open it.</div>}
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => setCameraOpen((current) => !current)}>{cameraOpen ? 'Close camera' : 'Open camera'}</button>
            <button type="button" className="btn btn-outline" onClick={handleCompleteScan}>Complete mock scan</button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-600)', marginTop: 12 }}>{cameraMessage}</p>
        </Panel>
        <Panel title="What the scanner confirms">
          <div className="consumer-detail-card">
            <h4>Farm-to-plate journey</h4>
            <p>Opening the camera lets the consumer verify a QR label and review the beef’s origin and chain of custody.</p>
            <p><strong>Latest example:</strong> Kiambu Highlands Farm → Agent AG-000123 → Retailer Greenview Butchery</p>
          </div>
        </Panel>
      </div>
    </>
  )

  const renderRetailerProfileView = () => (
    <>
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Retailer</p>
          <h1>{chainSteps.find((s) => s.who === 'Retailer')?.label || 'Retailer'}</h1>
          <p className="sub">View basic retailer info and contact details.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => setActiveView('home')}>Back home</button>
      </div>
      <div className="panel screen-surface">
        <div className="consumer-detail-card">
          <h4>{chainSteps.find((s) => s.who === 'Retailer')?.label}</h4>
          <p><strong>Location:</strong> Greenview Market</p>
          <p><strong>Contact:</strong> +254 700 000 000</p>
          <p><strong>Trust:</strong> Verified retailer</p>
        </div>
      </div>
    </>
  )

  return (
    <DashboardShell
      roleLabel="CONSUMER"
      actorId="CU-004821"
      name={profile.name}
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      onNotificationsToggle={handleNotificationToggle}
      onProfileClick={handleProfileToggle}
      notificationsActive={activeView === 'notifications'}
      profileActive={activeView === 'profile'}
    >
      {activeView === 'home' && renderHomeView()}
      {activeView === 'notifications' && renderNotificationsView()}
      {activeView === 'profile' && renderProfileView()}
      {activeView === 'scan-history' && renderScanHistoryView()}
      {activeView === 'reviews' && renderReviewsView()}
      {activeView === 'report-concern' && renderConcernView()}
      {activeView === 'scanner' && renderScannerView()}
      {activeView === 'retailer-profile' && renderRetailerProfileView()}
    </DashboardShell>
  )
}