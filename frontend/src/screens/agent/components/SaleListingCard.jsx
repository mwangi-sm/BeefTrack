import { Icon, IconPaths } from '../../../components/icons'
import './AgentBits.css'

export function SaleListingCard({ listing, onViewDetails }) {
  return (
    <div className="listing-card">
      <div className="listing-card-photo">
        <Icon size={30}>{IconPaths.animal}</Icon>
      </div>
      <div className="listing-card-body">
        <p className="listing-card-line"><b>{listing.breed}</b> · {listing.gender}</p>
        <p className="listing-card-line">{listing.ageMonths} months · {listing.weight} kg</p>
        <p className="listing-card-line muted">
          <Icon size={13}>{IconPaths.pin}</Icon>
          {listing.farmLocation} · {listing.farmName}
        </p>
      </div>
      <button className="btn btn-outline listing-card-btn" onClick={onViewDetails}>View details</button>
    </div>
  )
}
