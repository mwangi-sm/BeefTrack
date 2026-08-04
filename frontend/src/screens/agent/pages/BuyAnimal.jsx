//BuyAnimal.jsx code
import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { SaleListingCard } from '../components/SaleListingCard'
import { Icon, IconPaths } from '../../../components/icons'
import { getAgentNavItems } from '../data/agentNav'
import { REGIONS, SALE_LISTINGS } from '../data/saleListings'

export function BuyAnimal({ cart, onGoHome, onViewDetails, onRemoveFromCart }) {
  const [region, setRegion] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const navItems = getAgentNavItems('', { onGoHome })

  const listings = region ? SALE_LISTINGS.filter((l) => l.region === region) : []
  const cartListings = SALE_LISTINGS.filter((l) => cart.includes(l.id))

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
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Agent</p>
          <h1>Buy Animal</h1>
          <p className="sub">Browse posted sales by region and add animals to your cart.</p>
        </div>
        <div className="quick-actions">
          <button className="cart-btn" onClick={() => setCartOpen((v) => !v)}>
            <Icon size={17}>{IconPaths.cart}</Icon>
            In cart
            <span className="cart-badge">{cart.length}</span>
          </button>
        </div>
      </div>

      {cartOpen && (
        <div className="cart-panel">
          {cartListings.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-600)' }}>Your cart is empty.</p>
          ) : (
            cartListings.map((l) => (
              <div className="cart-panel-item" key={l.id}>
                <span>
                  <b className="mono">{l.id}</b> — {l.breed}, {l.gender}, {l.ageMonths} months
                </span>
                <button className="cart-remove" onClick={() => onRemoveFromCart(l.id)}>Remove</button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="setup-field" style={{ maxWidth: 340, marginBottom: 24 }}>
        <label htmlFor="region-select">Select the region of purchase</label>
        <select id="region-select" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">Select a region…</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {region && (
        <div className="listing-list">
          {listings.length === 0 ? (
            <p style={{ color: 'var(--ink-600)' }}>No posted sales in {region} yet.</p>
          ) : (
            listings.map((listing) => (
              <SaleListingCard key={listing.id} listing={listing} onViewDetails={() => onViewDetails(listing.id)} />
            ))
          )}
        </div>
      )}
    </DashboardShell>
  )
}
