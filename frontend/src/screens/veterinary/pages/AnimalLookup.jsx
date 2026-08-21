import { useState, useMemo } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { SplitText, DecryptedText } from '../../../components/reactbits'
import '../components/VeterinaryDashboard.css'

export default function AnimalLookup({ animals = [] }) {
  const [query, setQuery] = useState('')
  const [selectedAnimal, setSelectedAnimal] = useState(null)

  const filteredAnimals = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return animals

    return animals.filter((animal) =>
      [animal.id, animal.breed, animal.name]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    )
  }, [animals, query])

  return (
    <DashboardShell>
      <div className="lookup-hero">
        <h1><SplitText tag="span" text="Animal Lookup" splitType="words" duration={0.4} /></h1>
        <p className="sub">Search and monitor livestock under your care.</p>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by ID, breed, or name"
          aria-label="Search animals"
        />
      </div>

      <div className="vet-card-grid">
        {filteredAnimals.map((animal) => (
          <button
            type="button"
            className="vet-card"
            key={animal.id}
            onClick={() => setSelectedAnimal(animal)}
          >
            <div className="vet-card-info">
              <p className="vet-card-id"><DecryptedText text={String(animal.id)} animateOn="view" speed={30} maxIterations={6} /></p>
              <p className="vet-card-breed">{animal.breed || 'Breed not recorded'}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedAnimal && (
        <div className="detail-panel">
          <p className="detail-panel-id"><DecryptedText text={String(selectedAnimal.id)} animateOn="view" speed={30} maxIterations={7} /></p>
          <p>{selectedAnimal.breed || 'Breed not recorded'}</p>
        </div>
      )}
    </DashboardShell>
  )
}