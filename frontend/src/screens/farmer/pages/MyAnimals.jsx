import { DashboardShell } from '../../../components/DashboardShell'
import { AnimalCard } from '../components/AnimalCard'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'

export function MyAnimals({ animals, farms, onGoHome, onGoFarmSetup, onGoAnimalSetup, onGoMyFarms, onGoHealthRecords, onOpenAnimal, onToggleTheme, onLogout }) {
  const navItems = getFarmerNavItems('myanimals', {
    onGoHome,
    onGoFarmSetup,
    onGoAnimalSetup,
    onGoMyFarms,
    onGoMyAnimals: () => {},
    onGoHealthRecords,
  })

  const farmNameFor = (farmId) => farms.find((f) => f.id === farmId)?.name

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
          <h1>My Animals</h1>
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
        <div className="cards-grid">
          {animals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              farmName={farmNameFor(animal.farmId)}
              onOpenDetails={() => onOpenAnimal(animal.id)}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
