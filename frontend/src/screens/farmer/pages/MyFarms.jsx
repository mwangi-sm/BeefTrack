import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { FarmCard } from '../components/FarmCard'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'
import { SplitText } from '../../../components/reactbits'

export function MyFarms({ farms, animals, onGoHome, onGoFarmSetup, onGoAnimalSetup, onGoMyAnimals, onGoHealthRecords, onViewFarm, onManageFarm, onToggleTheme, onLogout }) {
  const [query, setQuery] = useState('')
  const [countyFilter, setCountyFilter] = useState('All counties')
  const navItems = getFarmerNavItems('myfarms', {
    onGoHome,
    onGoFarmSetup,
    onGoAnimalSetup,
    onGoMyFarms: () => {},
    onGoMyAnimals,
    onGoHealthRecords,
  })
  const counties = ['All counties', ...new Set(farms.map((farm) => farm.county).filter(Boolean))]
  const visibleFarms = farms.filter((farm) => {
    const matchesQuery = `${farm.name} ${farm.id}`.toLowerCase().includes(query.toLowerCase())
    const matchesCounty = countyFilter === 'All counties' || farm.county === countyFilter
    return matchesQuery && matchesCounty
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
          <h1><SplitText tag="span" text="My Farms" splitType="words" duration={0.4} /></h1>
          <p className="sub">All the farms registered under your account.</p>
        </div>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={onGoFarmSetup}>
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.plus}</Icon>Enroll new farm
          </button>
        </div>
      </div>

      {farms.length === 0 ? (
        <p style={{ color: 'var(--ink-600)' }}>You haven't registered any farms yet.</p>
      ) : (
        <>
          <div className="list-toolbar">
            <input aria-label="Search farms" placeholder="Search by farm name or ID" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select aria-label="Filter farms by county" value={countyFilter} onChange={(event) => setCountyFilter(event.target.value)}>
              {counties.map((county) => <option key={county}>{county}</option>)}
            </select>
          </div>
          {visibleFarms.length === 0 ? <p style={{ color: 'var(--ink-600)' }}>No farms match those filters.</p> : <div className="cards-grid">
          {visibleFarms.map((farm) => {
            const animalCount = animals.filter((a) => a.farmId === farm.id).length
            return (
              <FarmCard
                key={farm.id}
                farm={farm}
                animalCount={animalCount}
                onViewDetails={() => onViewFarm(farm.id)}
                onManage={() => onManageFarm(farm.id)}
              />
            )
          })}
          </div>}
        </>
      )}
    </DashboardShell>
  )
}