//AnimalSaleDetails.jsx code
import { DashboardShell } from '../../../components/DashboardShell'
import { InfoItem } from '../../farmer/components/InfoItem'
import { Icon, IconPaths } from '../../../components/icons'
import { getAgentNavItems } from '../data/agentNav'

export function AnimalSaleDetails({ listing, inCart, onGoHome, onBack, onRequestPurchase, onContactFarmer, onAddToCart, onShare }) {
  const navItems = getAgentNavItems('', { onGoHome })

  return (
    <DashboardShell
      roleLabel="AGENT"
      actorId="AG-000123"
      name="Samuel Otieno"
      navItems={navItems}
      variant="secondary"
      onGoHome={onGoHome}
    >
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Sale listing</p>
          <h1>{listing.breed} · {listing.gender}</h1>
        </div>
        <div className="quick-actions">
          <button className="btn btn-outline" onClick={onBack}>Back to listings</button>
        </div>
      </div>

      <div className="gallery-row">
        {[0, 1, 2, 3].map((i) => (
          <div className="gallery-thumb" key={i}>
            <Icon size={26}>{IconPaths.camera}</Icon>
          </div>
        ))}
      </div>

      <div className="sale-id-row">
        <span className="mono"><b>{listing.id}</b></span>
        <span className="mono">{listing.rfid}</span>
      </div>

      <p className="detail-section-title">Basic animal details</p>
      <div className="info-grid">
        <InfoItem label="Breed" value={listing.breed} />
        <InfoItem label="Gender" value={listing.gender} />
        <InfoItem label="Age" value={`${listing.ageMonths} months`} />
        <InfoItem label="Weight" value={`${listing.weight} kg`} />
      </div>

      <p className="detail-section-title">Owner information</p>
      <div className="info-grid">
        <InfoItem label="Farmer name" value={listing.farmerName} />
        <InfoItem label="Farmer BeefTrace ID" value={listing.farmerBeefTraceId} />
        <InfoItem label="Ownership" value={listing.ownership} />
      </div>

      <p className="detail-section-title">Farm information</p>
      <div className="info-grid">
        <InfoItem label="Farm name" value={listing.farmName} />
        <InfoItem label="Farm location" value={listing.farmLocation} />
        <InfoItem label="GPS pin" value={listing.gps} />
      </div>

      <p className="detail-section-title">Health information</p>
      <div className="info-grid">
        <InfoItem label="Current health status" value={listing.healthStatus} />
        <InfoItem label="Vaccination history" value={listing.vaccinations} />
        <InfoItem label="Deworming status" value={`${listing.dewormingStatus} (last: ${listing.lastDewormingDate})`} />
        <InfoItem label="Last veterinary checkup" value={listing.lastVetCheckup} />
      </div>

      <p className="detail-section-title">Veterinarian on call</p>
      <div className="info-grid">
        <InfoItem label="Veterinarian name" value={listing.vetName} />
        <InfoItem label="BeefTrace ID" value={listing.vetBeefTraceId} />
        <InfoItem label="Contact" value={listing.vetContact} />
      </div>

      <p className="detail-section-title">Health certificate</p>
      <div className="cert-card">
        <div className="cert-card-icon">
          <Icon size={22}>{IconPaths.certificate}</Icon>
        </div>
        <div>
          <p className="cert-card-name">{listing.healthCertificate}</p>
          <p className="cert-card-sub">Signed by {listing.vetName} · BeefTrace ID {listing.vetBeefTraceId}</p>
        </div>
      </div>

      <p className="detail-section-title">Movement history</p>
      {listing.movementHistory.map((m, i) => (
        <div className="movement-item" key={i}>
          <span className="movement-dot"></span>
          <div>
            <div className="movement-text">{m.note} — {m.location}</div>
            <div className="movement-time">{m.date}</div>
          </div>
        </div>
      ))}

      <div className="sale-actions">
        <button className="btn btn-primary" onClick={onRequestPurchase}>
          <Icon size={15} style={{ marginRight: 4 }}>{IconPaths.dollar}</Icon>Request Purchase
        </button>
        <button className="btn btn-outline" onClick={onContactFarmer}>
          <Icon size={15} style={{ marginRight: 4 }}>{IconPaths.phone}</Icon>Contact farmer
        </button>
        <button className="btn btn-outline" onClick={onAddToCart} disabled={inCart}>
          <Icon size={15} style={{ marginRight: 4 }}>{IconPaths.cart}</Icon>{inCart ? 'In cart' : 'Add to cart'}
        </button>
        <button className="btn btn-outline" onClick={onShare}>
          <Icon size={15} style={{ marginRight: 4 }}>{IconPaths.share}</Icon>Share animal
        </button>
      </div>
    </DashboardShell>
  )
}
