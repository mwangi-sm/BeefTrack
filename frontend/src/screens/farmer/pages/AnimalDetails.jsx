//AnimalDetails.jsx code
import { DashboardShell } from '../../../components/DashboardShell'
import { InfoItem } from '../components/InfoItem'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'
import { DecryptedText } from '../../../components/reactbits'

export function AnimalDetails({ animal, farm, onGoHome, onGoFarmSetup, onGoAnimalSetup, onGoMyFarms, onGoMyAnimals, onGoHealthRecords, onBack, onToggleTheme, onLogout }) {
  const navItems = getFarmerNavItems('myanimals', {
    onGoHome,
    onGoFarmSetup,
    onGoAnimalSetup,
    onGoMyFarms,
    onGoMyAnimals,
    onGoHealthRecords,
  })

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
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Animal details</p>
          <h1 className="mono"><DecryptedText text={animal.id} animateOn="view" speed={30} maxIterations={7} monospace={false} /></h1>
          <p className="sub">Full record for this animal.</p>
        </div>
        <div className="quick-actions">
          <button className="btn btn-outline" onClick={onBack}>Back</button>
        </div>
      </div>

      <div className="detail-head">
        <div className="detail-photo small">
          <Icon size={30}>{IconPaths.animal}</Icon>
        </div>
        <div className="detail-head-info">
          <h2 className="mono"><DecryptedText text={animal.id} animateOn="view" speed={30} maxIterations={7} monospace={false} /></h2>
          <div className="detail-head-meta">
            <span className="mono">{animal.rfid}</span>
            <span>{animal.breed || 'Breed not recorded'}</span>
            <span>{farm ? farm.name : 'Farm not linked'}</span>
          </div>
        </div>
      </div>

      <p className="detail-section-title">Identification</p>
      <div className="info-grid">
        <InfoItem label="RFID tag number" value={animal.rfid} />
        <InfoItem label="Alternative ID" value={animal.altId} />
      </div>

      <p className="detail-section-title">Basic details</p>
      <div className="info-grid">
        <InfoItem label="Gender" value={animal.gender} />
        <InfoItem label="Breed" value={animal.breed} />
        <InfoItem label="Date of birth" value={animal.dob} />
        <InfoItem label="Source" value={animal.source} />
      </div>

      <p className="detail-section-title">Health</p>
      <div className="info-grid">
        <InfoItem label="Current health status" value={animal.healthStatus} />
        <InfoItem label="Current weight" value={animal.weight ? `${animal.weight} kg` : ''} />
        <InfoItem label="Vaccination history" value={animal.vaccinations} />
        <InfoItem label="Diseases experienced" value={animal.diseases} />
      </div>

      <p className="detail-section-title">Veterinary visits</p>
      {!animal.vetVisits || animal.vetVisits.length === 0 ? (
        <p style={{ color: 'var(--ink-600)' }}>No veterinary visits logged for this animal yet.</p>
      ) : (
        [...animal.vetVisits].reverse().map((visit, i) => (
          <div className="care-row" key={i}>
            <span className="care-id mono">{visit.date}</span>
            <div className="care-info">
              <div className="type">{visit.notes || 'No notes recorded'}</div>
              <div className="due">{visit.vetName}</div>
            </div>
            <span className="status-pill status-ok">{visit.healthStatus}</span>
          </div>
        ))
      )}
    </DashboardShell>
  )
}