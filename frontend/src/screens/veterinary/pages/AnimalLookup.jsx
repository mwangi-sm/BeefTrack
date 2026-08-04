//AnimalLookup.jx code
import { useState, useMemo } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Icon, IconPaths } from '../../../components/icons'
import '../components/VeterinaryDashboard.css'

const NEEDS_ATTENTION = ['Under treatment', 'Sick', 'Quarantined', 'Needs Attention']

const FILTER_CHIPS = [
  { key: 'all', label: 'All Animals' },
  { key: 'my-care', label: 'Under My Care' },
  { key: 'attention', label: 'Needs Attention' },
  { key: 'quarantined', label: 'Quarantined' },
  { key: 'medication', label: 'On Medication' },
  { key: 'healthy', label: 'Healthy' },
]

const DETAIL_TABS = ['Overview', 'Health Timeline', 'Treatments', 'Vaccinations', 'Documents', 'Notes']

// ---- Mock documents ----
const MOCK_DOCUMENTS = [
  { name: 'Routine inspection report.pdf', date: '15 Jul 2026', id: 'doc-1' },
  { name: 'Blood test results.pdf', date: '02 Jul 2026', id: 'doc-2' },
  { name: 'Vaccination certificate.pdf', date: '10 Apr 2026', id: 'doc-3' },
  { name: 'Movement permit.pdf', date: '05 Mar 2026', id: 'doc-4' },
]

function getStatusBadgeClass(status) {
  const s = (status || '').toLowerCase()
  if (s === 'healthy') return 'vet-status-healthy'
  if (s === 'quarantined') return 'vet-status-quarantined'
  if (s === 'on medication' || s === 'under treatment') return 'vet-status-medication'
  if (s === 'needs attention' || s === 'sick') return 'vet-status-attention'
  return 'vet-status-attention'
}

function getTimelineDotClass(type) {
  const t = (type || '').toLowerCase()
  if (t.includes('quarantine')) return 'attention'
  if (t.includes('medication') || t.includes('treatment')) return 'medication'
  return ''
}

function calculateAge(dob) {
  if (!dob) return 'Unknown'
  const birth = new Date(dob)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const totalMonths = years * 12 + months
  if (totalMonths < 12) return `${totalMonths} months`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y} year${y > 1 ? 's' : ''} ${m} month${m > 1 ? 's' : ''}` : `${y} year${y > 1 ? 's' : ''}`
}

// `onOpenDashboard` is called when the "Dashboard" nav item is clicked —
// wire it to however your app switches screens (setState or react-router
// navigate()); see the two wiring examples in the accompanying notes.
export function AnimalLookup({ onLogout, onToggleTheme, farms, animals, onOpenDashboard }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedFarm, setSelectedFarm] = useState('')
  const [selectedAnimalId, setSelectedAnimalId] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')

  const [noteText, setNoteText] = useState('')
  const [animalNotes, setAnimalNotes] = useState({})

  const farmNameFor = (farmId) => farms.find((f) => f.id === farmId)?.name || 'Unknown farm'
  const selectedAnimal = useMemo(() => animals.find((a) => a.id === selectedAnimalId), [animals, selectedAnimalId])

  const filteredAnimals = useMemo(() => {
    let result = animals

    if (selectedFarm) {
      result = result.filter((a) => a.farmId === selectedFarm)
    }

    switch (activeFilter) {
      case 'attention':
        result = result.filter((a) => NEEDS_ATTENTION.includes(a.healthStatus) || a.healthStatus === 'Needs Attention')
        break
      case 'quarantined':
        result = result.filter((a) => a.healthStatus === 'Quarantined')
        break
      case 'medication':
        result = result.filter((a) => a.healthStatus === 'On Medication' || a.healthStatus === 'Under treatment')
        break
      case 'healthy':
        result = result.filter((a) => a.healthStatus === 'Healthy')
        break
      case 'my-care':
        // In a real app this would filter by the vet's assigned animals. For now, show all.
        break
      case 'all':
      default:
        break
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.rfid.toLowerCase().includes(q) ||
          (a.altId && a.altId.toLowerCase().includes(q))
      )
    }

    return result
  }, [animals, selectedFarm, activeFilter, searchQuery])

  const navItems = [
    { label: 'Dashboard', icon: IconPaths.grid, active: false, onClick: onOpenDashboard },
    { label: 'Animal lookup', icon: IconPaths.search, active: true, onClick: () => {} },
    { label: 'Scheduled visits', icon: IconPaths.schedule, onClick: () => {} },
    { label: 'Inspection history', icon: IconPaths.clock, onClick: () => {} },
    { label: 'Notifications', icon: IconPaths.bell, onClick: () => {} },
    { label: 'Settings', icon: IconPaths.gear, onClick: () => {} },
  ]

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedAnimalId) return
    const note = {
      text: noteText.trim(),
      date: new Date().toISOString().slice(0, 10),
      vet: 'Dr. Achieng Otieno',
    }
    setAnimalNotes((prev) => ({
      ...prev,
      [selectedAnimalId]: [...(prev[selectedAnimalId] || []), note],
    }))
    setNoteText('')
  }

  return (
    <DashboardShell
      roleLabel="VETERINARY"
      actorId="VT-000102"
      name="Dr. Achieng Otieno"
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      variant="home"
    >
      <div className="lookup-hero">
        <h1>Animal Lookup</h1>
        <p className="sub">Search and monitor livestock under your care.</p>

        <div className="search-row">
          <div className="search-input-wrap">
            <Icon size={17}>{IconPaths.search}</Icon>
            <input
              type="text"
              placeholder="Search RFID, QR Code or Animal ID..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedAnimalId(null) }}
            />
          </div>
          <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            <Icon size={15} style={{ marginRight: 4 }}>{IconPaths.qr}</Icon>Scan QR / RFID
          </button>
        </div>

        <div className="filter-bar">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              className={`filter-chip${activeFilter === chip.key ? ' active' : ''}`}
              onClick={() => { setActiveFilter(chip.key); setSelectedAnimalId(null) }}
            >
              {chip.label}
            </button>
          ))}
          <div className="filter-spacer" />
          <select
            className="filter-farm-select"
            value={selectedFarm}
            onChange={(e) => { setSelectedFarm(e.target.value); setSelectedAnimalId(null) }}
          >
            <option value="">All Farms</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="lookup-body">
        <div>
          {filteredAnimals.length === 0 ? (
            <p style={{ color: 'var(--ink-600)', fontSize: 13.5, padding: '20px 0' }}>
              No animals match your current filters.
            </p>
          ) : (
            <div className="animal-cards-grid">
              {filteredAnimals.map((animal) => (
                <div
                  key={animal.id}
                  className={`vet-animal-card${selectedAnimalId === animal.id ? ' selected' : ''}`}
                  onClick={() => setSelectedAnimalId(animal.id)}
                >
                  <div className="vet-card-photo">
                    {animal.photoUrl ? (
                      <img src={animal.photoUrl} alt={animal.id} />
                    ) : (
                      <Icon size={36}>{IconPaths.animal}</Icon>
                    )}
                  </div>
                  <div className="vet-card-info">
                    <p className="vet-card-id">{animal.id}</p>
                    <p className="vet-card-breed">{animal.breed || 'Breed not recorded'}</p>
                    <p className="vet-card-meta">
                      <span>{animal.gender}</span>
                      <span>·</span>
                      <span>{animal.age || calculateAge(animal.dob)}</span>
                    </p>
                    <p className="vet-card-farm">{farmNameFor(animal.farmId)}</p>
                  </div>
                  <div className="vet-card-footer">
                    <span className={`vet-status-badge ${getStatusBadgeClass(animal.healthStatus)}`}>
                      {animal.healthStatus || 'Unknown'}
                    </span>
                    <span className="vet-card-date">
                      {animal.vetVisits?.length
                        ? `Last: ${animal.vetVisits[animal.vetVisits.length - 1].date}`
                        : 'No visits yet'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-panel">
          {!selectedAnimal ? (
            <div className="detail-panel-empty">
              <Icon size={40}>{IconPaths.search}</Icon>
              <p className="empty-title">Select an Animal</p>
              <p>Click any animal card to view its complete health profile here.</p>
            </div>
          ) : (
            <>
              <div className="detail-panel-header">
                <div className="vet-card-photo">
                  {selectedAnimal.photoUrl ? (
                    <img src={selectedAnimal.photoUrl} alt={selectedAnimal.id} />
                  ) : (
                    <Icon size={42}>{IconPaths.animal}</Icon>
                  )}
                </div>
                <p className="detail-panel-id">{selectedAnimal.id}</p>
                <div className="detail-panel-meta">
                  <span>{selectedAnimal.breed || 'Unknown breed'}</span>
                  <span>·</span>
                  <span>{selectedAnimal.gender}</span>
                  <span>·</span>
                  <span>{selectedAnimal.age || calculateAge(selectedAnimal.dob)}</span>
                </div>
                <span className={`vet-status-badge ${getStatusBadgeClass(selectedAnimal.healthStatus)}`}>
                  {selectedAnimal.healthStatus || 'Unknown'}
                </span>
              </div>

              <div className="detail-tabs">
                {DETAIL_TABS.map((tab) => (
                  <button
                    key={tab}
                    className={`detail-tab${activeTab === tab ? ' active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="detail-tab-content">
                {activeTab === 'Overview' && (
                  <>
                    <div className="detail-info-mini">
                      <div className="info-mini-item">
                        <p className="info-mini-label">RFID</p>
                        <p className="info-mini-value">{selectedAnimal.rfid}</p>
                      </div>
                      <div className="info-mini-item">
                        <p className="info-mini-label">Owner</p>
                        <p className="info-mini-value">{selectedAnimal.owner || 'Wanjiku Mwangi'}</p>
                      </div>
                      <div className="info-mini-item">
                        <p className="info-mini-label">Farm</p>
                        <p className="info-mini-value">{farmNameFor(selectedAnimal.farmId)}</p>
                      </div>
                      <div className="info-mini-item">
                        <p className="info-mini-label">County</p>
                        <p className="info-mini-value">{farms.find((f) => f.id === selectedAnimal.farmId)?.county || 'Kiambu'}</p>
                      </div>
                      <div className="info-mini-item">
                        <p className="info-mini-label">Weight</p>
                        <p className="info-mini-value">{selectedAnimal.weight ? `${selectedAnimal.weight} kg` : 'Not recorded'}</p>
                      </div>
                      <div className="info-mini-item">
                        <p className="info-mini-label">Source</p>
                        <p className="info-mini-value">{selectedAnimal.source || 'Not recorded'}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div className="overview-card">
                        <h4>Current Status</h4>
                        <p>{selectedAnimal.healthStatus === 'Healthy' ? 'This animal is in good health with no current concerns.' : `Status: ${selectedAnimal.healthStatus}. ${selectedAnimal.diseases || 'Monitoring recommended.'}`}</p>
                      </div>
                      <div className="overview-card">
                        <h4>Health Summary</h4>
                        <p>Vaccinations: {(selectedAnimal.vaccinations || []).join(', ') || 'None recorded'}. Previous diseases: {selectedAnimal.diseases || 'None recorded'}.</p>
                      </div>
                      <div className="overview-card">
                        <h4>Last Inspection</h4>
                        <p>{selectedAnimal.vetVisits?.length ? `${selectedAnimal.vetVisits[selectedAnimal.vetVisits.length - 1].date} — ${selectedAnimal.vetVisits[selectedAnimal.vetVisits.length - 1].notes}` : 'No inspections recorded yet.'}</p>
                      </div>
                      <div className="overview-card">
                        <h4>Basic Information</h4>
                        <p>ID: {selectedAnimal.id} · RFID: {selectedAnimal.rfid} · Breed: {selectedAnimal.breed || 'Unknown'} · Gender: {selectedAnimal.gender} · DOB: {selectedAnimal.dob || 'Unknown'} · Age: {selectedAnimal.age || calculateAge(selectedAnimal.dob)}</p>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'Health Timeline' && (
                  <div className="timeline-list">
                    {selectedAnimal.inspections && selectedAnimal.inspections.length > 0 ? (
                      [...selectedAnimal.inspections].reverse().map((insp, i) => (
                        <div key={i} className="timeline-item">
                          <div className={`timeline-dot ${getTimelineDotClass(insp.type)}`} />
                          <div className="timeline-content">
                            <div className="tl-type">{insp.type}</div>
                            <div className="tl-date">{insp.date} · {insp.vetName}</div>
                            <div className="tl-notes">{insp.notes}</div>
                          </div>
                        </div>
                      ))
                    ) : selectedAnimal.vetVisits && selectedAnimal.vetVisits.length > 0 ? (
                      [...selectedAnimal.vetVisits].reverse().map((v, i) => (
                        <div key={i} className="timeline-item">
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <div className="tl-type">Veterinary visit</div>
                            <div className="tl-date">{v.date} · {v.vetName}</div>
                            <div className="tl-notes">{v.notes}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>No health timeline recorded yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'Treatments' && (
                  <>
                    {selectedAnimal.treatments && selectedAnimal.treatments.length > 0 ? (
                      selectedAnimal.treatments.map((t, i) => (
                        <div key={i} className="treatment-card">
                          <p className="treat-med">{t.medication}</p>
                          <div className="treat-meta">
                            <span>Dosage: {t.dosage}</span>
                            <span>Frequency: {t.frequency}</span>
                            <span>Vet: {t.veterinarian}</span>
                            <span>Start: {t.startDate}</span>
                            {t.endDate && <span>End: {t.endDate}</span>}
                          </div>
                          <span className={`treat-status ${t.status === 'Active' ? 'treat-active' : 'treat-completed'}`}>
                            {t.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>No active or past treatments recorded.</p>
                    )}
                  </>
                )}

                {activeTab === 'Vaccinations' && (
                  <div className="vax-list">
                    {selectedAnimal.vaccinations && selectedAnimal.vaccinations.length > 0 ? (
                      selectedAnimal.vaccinations.map((v, i) => (
                        <div key={i} className="vax-item">
                          <div className="vax-icon">
                            <Icon size={14}>{IconPaths.syringe}</Icon>
                          </div>
                          <span className="vax-name">{v}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>No vaccinations recorded.</p>
                    )}
                  </div>
                )}

                {activeTab === 'Documents' && (
                  <>
                    {MOCK_DOCUMENTS.map((doc) => (
                      <div key={doc.id} className="doc-item">
                        <div className="doc-icon">
                          <Icon size={15}>{IconPaths.certificate}</Icon>
                        </div>
                        <div className="doc-info">
                          <p className="doc-name">{doc.name}</p>
                          <p className="doc-date">{doc.date}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {activeTab === 'Notes' && (
                  <>
                    <div className="notes-list">
                      {(animalNotes[selectedAnimalId] || []).length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--ink-600)' }}>No notes yet. Add one below.</p>
                      ) : (
                        (animalNotes[selectedAnimalId] || []).map((n, i) => (
                          <div key={i} className="note-item">
                            {n.text}
                            <div className="note-meta">{n.date} · {n.vet}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="note-input-row">
                      <textarea
                        placeholder="Add a note about this animal..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                      <button className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 13 }} onClick={handleAddNote}>
                        Add
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
