// imports
import { useMemo, useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Icon, IconPaths } from '../../../components/icons'
import { getVeterinaryNavItems } from '../data/veterinaryNav'
import { SplitText, DecryptedText } from '../../../components/reactbits'
import '../components/VeterinaryDashboard.css'

export default function LogVisit() {
  const [query, setQuery] = useState('')
  const [selectedAnimalId, setSelectedAnimalId] = useState(null)
  const [farmId] = useState(null)
  const animals = useMemo(() => [], [])
  const filteredAnimals = useMemo(
    () => animals.filter((animal) => animal.id.toLowerCase().includes(query.toLowerCase())),
    [animals, query],
  )
  const selectedAnimal = animals.find((animal) => animal.id === selectedAnimalId)
  const farmName = (id) => id || 'Not recorded'

  return (
    <DashboardShell navItems={getVeterinaryNavItems()}>
      <div className="vet-page-head"><div><p className="setup-title"><SplitText tag="span" text="Log Visit" splitType="words" duration={0.4} /></p><p className="setup-subtitle">Record veterinary examinations, treatments and procedures for animals under your care.</p></div></div>
      {farmId && <section className="vet-form-section"><h2>2. Select Animal</h2><div className="vet-search-actions"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter Animal BeefTrace ID" /><button type="button" className="btn btn-outline"><Icon size={15}>{IconPaths.qr}</Icon>Scan RFID</button></div><div className="vet-visit-animal-grid">{filteredAnimals.map((animal) => <button type="button" key={animal.id} className={`vet-visit-animal${selectedAnimalId === animal.id ? ' selected' : ''}`} onClick={() => setSelectedAnimalId(animal.id)}><div className="vet-visit-photo">{animal.photoUrl ? <img src={animal.photoUrl} alt={animal.id} /> : <Icon size={30}>{IconPaths.animal}</Icon>}</div><strong className="mono"><DecryptedText text={animal.id} animateOn="view" speed={30} maxIterations={6} /></strong><span>{animal.breed || 'Breed not recorded'} · {animal.gender}</span><span>{animal.age || animal.dob || 'Age not recorded'} · {animal.healthStatus}</span><span className="btn btn-outline">Select</span></button>)}</div></section>}
      {selectedAnimal && <section className="vet-form-section"><h2>3. Animal Summary</h2><div className="vet-summary-card"><div className="vet-summary-grid"><div className="vet-summary-photo">{selectedAnimal.photoUrl ? <img src={selectedAnimal.photoUrl} alt={selectedAnimal.id} /> : <Icon size={42}>{IconPaths.animal}</Icon>}</div><div><strong className="mono"><DecryptedText text={selectedAnimal.id} animateOn="view" speed={30} maxIterations={7} /></strong><p>{selectedAnimal.breed || 'Breed not recorded'} · {selectedAnimal.gender}</p><p>Farm: {farmName(selectedAnimal.farmId)}</p></div></div></div></section>}
    </DashboardShell>
  )
}