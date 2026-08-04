import { DashboardShell } from '../../../components/DashboardShell'
import { FarmCard } from '../components/FarmCard'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'

export function MyFarms({ farms, animals, onGoHome, onGoFarmSetup, onGoAnimalSetup, onGoMyAnimals, onGoHealthRecords, onViewFarm, onManageFarm, onToggleTheme, onLogout }) {
  const navItems = getFarmerNavItems('myfarms', {
    onGoHome,
    onGoFarmSetup,
    onGoAnimalSetup,
    onGoMyFarms: () => {},
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
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Farmer</p>
          <h1>My Farms</h1>
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
        <div className="cards-grid">
          {farms.map((farm) => {
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
        </div>
      )}
    </DashboardShell>
  )
}
