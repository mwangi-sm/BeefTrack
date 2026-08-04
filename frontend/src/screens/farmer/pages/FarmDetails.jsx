//FarmDetails.jsx code
import { DashboardShell } from '../../../components/DashboardShell'
import { AnimalCard } from '../components/AnimalCard'
import { InfoItem } from '../components/InfoItem'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'

export function FarmDetails({ farm, animals, onGoHome, onGoFarmSetup, onGoAnimalSetup, onGoMyFarms, onGoMyAnimals, onGoHealthRecords, onManageFarm, onOpenAnimal, onToggleTheme, onLogout }) {
  const navItems = getFarmerNavItems('myfarms', {
    onGoHome,
    onGoFarmSetup,
    onGoAnimalSetup,
    onGoMyFarms,
    onGoMyAnimals,
    onGoHealthRecords,
  })

  const farmAnimals = animals.filter((a) => a.farmId === farm.id)

  return (
    <DashboardShell
      roleLabel="FARMER"
      actorId="F-2026-0001"
      name="Wanjiku Mwangi"
      navItems={navItems}
      variant="secondary"
      onGoHome={onGoHome}
      onToggleTheme={onToggleTheme}
      onLogout={onLogout}
    >
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Farm details</p>
          <h1>{farm.name}</h1>
          <p className="sub">Everything on record for this farm.</p>
        </div>
        <div className="quick-actions">
          <button className="btn btn-outline" onClick={onGoMyFarms}>Back to My Farms</button>
          <button className="btn btn-primary" onClick={() => onManageFarm(farm.id)}>
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.edit}</Icon>Manage farm
          </button>
        </div>
      </div>

      <div className="detail-head">
        <div className="detail-photo">
          <Icon size={38}>{IconPaths.camera}</Icon>
        </div>
        <div className="detail-head-info">
          <h2>{farm.name}</h2>
          <div className="detail-head-meta">
            <span><Icon size={14}>{IconPaths.route}</Icon>{farm.county || 'Location not set'}</span>
            <span className="mono">{farm.id}</span>
            <span><Icon size={14}>{IconPaths.boxes}</Icon>{farm.size ? `${farm.size} acres` : 'Size not recorded'}</span>
          </div>
        </div>
      </div>

      <p className="detail-section-title">Basic farm information</p>
      <div className="info-grid">
        <InfoItem label="Ownership type" value={farm.ownership} />
        <InfoItem label="Water source" value={farm.waterSource} />
        <InfoItem label="Feed sources" value={farm.feedSources} />
        <InfoItem label="Farming practice" value={farm.practice} />
        <InfoItem label="Farm workers" value={farm.workers} />
        <InfoItem label="Vet provider" value={farm.vetName} />
        <InfoItem label="Vet contact" value={farm.vetNumber} />
      </div>

      <p className="detail-section-title">Location details</p>
      <div className="info-grid">
        <InfoItem label="Sub-county" value={farm.subCounty} />
        <InfoItem label="Ward" value={farm.ward} />
        <InfoItem label="Village / estate" value={farm.village} />
        <InfoItem label="GPS location" value={farm.gps} />
      </div>

      <p className="detail-section-title">Documentation</p>
      <div className="info-grid">
        <InfoItem label="Farm photos on file" value={farm.photosCount ? `${farm.photosCount} photos` : ''} />
      </div>

      <p className="detail-section-title">Registered animals ({farmAnimals.length})</p>
      {farmAnimals.length === 0 ? (
        <p style={{ color: 'var(--ink-600)' }}>No animals registered under this farm yet.</p>
      ) : (
        <div className="cards-grid">
          {farmAnimals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} onOpenDetails={() => onOpenAnimal(animal.id)} />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
