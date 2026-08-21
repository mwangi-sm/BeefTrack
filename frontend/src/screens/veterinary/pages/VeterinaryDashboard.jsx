//VeterinaryDashboard.jsx code
import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { DashHead } from '../../../components/DashHead'
import { NoteBanner, StatCard, Panel, CareRow } from '../../../components/DashboardBits'
import { TextInput, SelectInput, TextArea } from '../../farmer/components/SetupBits'
import { Icon, IconPaths } from '../../../components/icons'
import { StrokeText, SplitText, DecryptedText } from '../../../components/reactbits'
import '../components/VeterinaryDashboard.css'

const NEEDS_ATTENTION = ['Under treatment', 'Sick', 'Quarantined', 'Needs Attention']

// `onOpenLookup` is called when the "Animal lookup" nav item is clicked —
// wire it to however your app switches screens (setState or react-router
// navigate()); see the two wiring examples in the accompanying notes.
export function VeterinaryDashboard({ onLogout, onToggleTheme, fullname = 'Veterinary officer', farms, animals, onRecordInspection, onOpenLookup, onOpenTraceability, onOpenLogVisit, onOpenInspectionHistory }) {
  const [lookup, setLookup] = useState('')
  const [foundAnimal, setFoundAnimal] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [healthStatus, setHealthStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [visitDate, setVisitDate] = useState('')

  const farmNameFor = (farmId) => farms.find((f) => f.id === farmId)?.name || 'Unknown farm'

  const navItems = [
    { label: 'Dashboard', icon: IconPaths.grid, active: true, onClick: () => {} },
    { label: 'Animal lookup', icon: IconPaths.search, active: false, onClick: onOpenLookup },
    { label: 'Scheduled visits', icon: IconPaths.schedule, onClick: () => {} },
    { label: 'Inspection history', icon: IconPaths.clock, onClick: onOpenInspectionHistory },
    { label: 'Settings', icon: IconPaths.gear, onClick: () => {} },
  ]

  const attentionAnimals = animals.filter((a) => NEEDS_ATTENTION.includes(a.healthStatus))
  const totalVisits = animals.reduce((sum, a) => sum + (a.vetVisits?.length || 0), 0)
  const recentVisits = animals
    .flatMap((a) => (a.vetVisits || []).map((v) => ({ ...v, animalId: a.id })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)

  const handleLookup = (e) => {
    e.preventDefault()
    const normalizedLookup = lookup.trim().toLowerCase()
    const match = animals.find(
      (a) => String(a.id || '').toLowerCase() === normalizedLookup || String(a.rfid || '').toLowerCase() === normalizedLookup
    )
    if (match) {
      setFoundAnimal(match)
      setHealthStatus(match.healthStatus || '')
      setNotes('')
      setVisitDate('')
      setNotFound(false)
    } else {
      setFoundAnimal(null)
      setNotFound(true)
    }
  }

  const handleLogInspection = (e) => {
    e.preventDefault()
    if (!foundAnimal) return
    onRecordInspection(foundAnimal.id, {
      date: visitDate || new Date().toISOString().slice(0, 10),
      vetName: 'Dr. Achieng Otieno',
      notes,
      healthStatus,
    })
    setFoundAnimal(null)
    setLookup('')
    setNotes('')
    setVisitDate('')
    setHealthStatus('')
  }

  return (
    <DashboardShell
      roleLabel="VETERINARY"
      actorId="VT-000102"
      name={fullname}
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      variant="home"
    >
      <DashHead
        greeting={`Good morning,  ${fullname}`}
        title={
          <StrokeText
            as="span"
            text="Animal Health & Certification"
            strokeColor="var(--gold-600)"
            fillColor="var(--ink-900)"
            strokeWidth={1.1}
            drawDuration={1}
            fillDelay={0.12}
            stagger={0.02}
            fontSize={36}
            fontWeight={700}
            letterSpacing={-1}
          />
        }
        subtitle="Animals under your care, across every farm you're linked to."
        actions={
          <>
            <button className="btn btn-outline" onClick={onOpenTraceability}><Icon size={15} style={{ marginRight: 2 }}>{IconPaths.qr}</Icon>Traceability lookup</button>
            <button className="btn btn-primary" onClick={onOpenLogVisit}><Icon size={15} style={{ marginRight: 2 }}>{IconPaths.book}</Icon>Log visit</button>
          </>
        }
      />

      {attentionAnimals.length > 0 && (
        <NoteBanner>
          <b>{attentionAnimals.length} {attentionAnimals.length === 1 ? 'animal needs' : 'animals need'}</b> attention right now — see "Animals needing attention" below.
        </NoteBanner>
      )}

      <div className="stat-grid">
        <StatCard icon={IconPaths.animal} flagText="Linked" value={animals.length} label="Animals under care" />
        <StatCard icon={IconPaths.alert} flagText="Needs attention" flagType={attentionAnimals.length ? 'attn' : 'ok'} value={attentionAnimals.length} label="Health alerts" />
        <StatCard icon={IconPaths.check} flagText="Logged" value={totalVisits} label="Inspections recorded" />
        <StatCard icon={IconPaths.farm} flagText="Connected" value={farms.length} label="Farms you work with" />
      </div>

      <div className="grid-2col">
        <div>
          <Panel title={<SplitText tag="span" text="Animals needing attention" splitType="words" duration={0.4} />}>
            {attentionAnimals.length === 0 ? (
              <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>
                {animals.length === 0 ? 'No animals linked to you yet.' : 'Every animal you cover is currently marked healthy.'}
              </p>
            ) : (
              attentionAnimals.map((a) => (
                <CareRow
                  key={a.id}
                  id={<DecryptedText text={a.id} animateOn="view" speed={30} maxIterations={6} />}
                  type={`${a.breed || 'Breed not recorded'} · ${farmNameFor(a.farmId)}`}
                  due={a.diseases || 'No notes on file'}
                  status={a.healthStatus === 'Quarantined' ? 'overdue' : 'soon'}
                  label={a.healthStatus}
                />
              ))
            )}
          </Panel>

          <Panel title={<SplitText tag="span" text="Recent inspections" splitType="words" duration={0.4} />}>
            {recentVisits.length === 0 ? (
              <p style={{ color: 'var(--ink-600)', fontSize: 13.5 }}>No inspections logged yet.</p>
            ) : (
              recentVisits.map((v, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-dot"></span>
                  <div>
                    <div className="activity-text">
                      <b><DecryptedText text={v.animalId} animateOn="view" speed={30} maxIterations={6} monospace={false} /></b> — {v.notes || 'No notes recorded'}
                    </div>
                    <div className="activity-time">{v.date} · {v.vetName}</div>
                  </div>
                </div>
              ))
            )}
          </Panel>
        </div>

        <div>
          <Panel title={<SplitText tag="span" text="Look up an animal" splitType="words" duration={0.4} />}>
            <form onSubmit={handleLookup}>
              <TextInput
                label="Animal BeefTrace ID or RFID number"
                placeholder="e.g. BT-000245 or RFID-000245"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                <Icon size={15} style={{ marginRight: 4 }}>{IconPaths.search}</Icon>Look up animal
              </button>
            </form>

            {notFound && (
              <p style={{ color: 'var(--rust-600)', fontSize: 13, marginTop: 12 }}>
                No animal found with that ID or RFID number.
              </p>
            )}

            {foundAnimal && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-soft)' }}>
                <p className="onboard-heading" style={{ marginBottom: 12 }}>
                  <DecryptedText text={foundAnimal.id} animateOn="view" speed={30} maxIterations={6} monospace={false} /> · {foundAnimal.breed || 'Breed not recorded'} · {farmNameFor(foundAnimal.farmId)}
                </p>
                <form onSubmit={handleLogInspection}>
                  <SelectInput
                    label="Updated health status"
                    options={['Healthy', 'Under treatment', 'Sick', 'Quarantined', 'Deceased']}
                    value={healthStatus}
                    onChange={(e) => setHealthStatus(e.target.value)}
                  />
                  <TextInput label="Visit date" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
                  <TextArea
                    label="Inspection notes"
                    placeholder="Findings, treatment given, follow-up needed…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                    Log inspection
                  </button>
                </form>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </DashboardShell>
  )
}