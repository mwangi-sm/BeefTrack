import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { AnimalCard } from '../components/AnimalCard'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'
import { SplitText } from '../../../components/reactbits'

export function MyAnimals({ animals, farms, onGoHome, onGoFarmSetup, onGoAnimalSetup, onGoMyFarms, onGoHealthRecords, onOpenAnimal, onToggleTheme, onLogout }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const navItems = getFarmerNavItems('myanimals', {
    onGoHome,
    onGoFarmSetup,
    onGoAnimalSetup,
    onGoMyFarms,
    onGoMyAnimals: () => {},
    onGoHealthRecords,
  })

  const farmNameFor = (farmId) => farms.find((f) => f.id === farmId)?.name
  const statuses = ['All statuses', ...new Set(animals.map((animal) => animal.healthStatus).filter(Boolean))]
  const visibleAnimals = animals.filter((animal) => {
    const farmName = farmNameFor(animal.farmId) || ''
    const matchesQuery = `${animal.id} ${animal.rfid || ''} ${farmName}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = statusFilter === 'All statuses' || animal.healthStatus === statusFilter
    return matchesQuery && matchesStatus
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
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Farmer</p>
          <h1><SplitText tag="span" text="My Animals" splitType="words" duration={0.4} /></h1>
          <p className="sub">Every animal registered across your farms.</p>
        </div>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={onGoAnimalSetup}>
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.plus}</Icon>Enroll new animal
          </button>
        </div>
      </div>

      {animals.length === 0 ? (
        <p style={{ color: 'var(--ink-600)' }}>You haven't registered any animals yet.</p>
      ) : (
        <>
          <div className="list-toolbar">
            <input aria-label="Search animals" placeholder="Search by tag or farm" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select aria-label="Filter animals by health status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          {visibleAnimals.length === 0 ? <p style={{ color: 'var(--ink-600)' }}>No animals match those filters.</p> : <div className="cards-grid">
          {visibleAnimals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              farmName={farmNameFor(animal.farmId)}
              onOpenDetails={() => onOpenAnimal(animal.id)}
            />
          ))}
          </div>}
        </>
      )}
    </DashboardShell>
  )
}