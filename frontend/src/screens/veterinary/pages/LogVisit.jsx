import { useMemo, useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Icon, IconPaths } from '../../../components/icons'
import { getVeterinaryNavItems } from '../data/veterinaryNav'
import '../components/VeterinaryDashboard.css'

const REASONS = ['Routine Check-up', 'Vaccination', 'Disease Treatment', 'Artificial Insemination', 'Pregnancy Examination', 'Emergency Treatment', 'Other Veterinary Procedure']

const FORM_FIELDS = {
  'Routine Check-up': ['visitDate', 'weight', 'temperature', 'heartRate', 'respiratoryRate', 'bodyConditionScore', 'healthStatus', 'clinicalObservations', 'notes', 'followUpDate'],
  Vaccination: ['visitDate', 'weight', 'vaccineName', 'manufacturer', 'batchNumber', 'doseAdministered', 'administrationRoute', 'injectionSite', 'nextVaccinationDue', 'observations', 'notes'],
  'Disease Treatment': ['visitDate', 'weight', 'diagnosis', 'symptomsObserved', 'medication', 'dosage', 'administrationRoute', 'treatmentDuration', 'withdrawalPeriod', 'treatmentOutcome', 'notes', 'followUpDate'],
  'Artificial Insemination': ['visitDate', 'weight', 'heatDetectionDate', 'semenBatchNumber', 'bullId', 'technician', 'methodUsed', 'pregnancyCheckDate', 'notes'],
  'Pregnancy Examination': ['visitDate', 'weight', 'pregnancyStatus', 'estimatedGestation', 'expectedCalvingDate', 'observations', 'recommendations', 'notes'],
  'Emergency Treatment': ['visitDate', 'weight', 'emergencyType', 'clinicalFindings', 'immediateTreatmentGiven', 'medication', 'outcome', 'referralRequired', 'notes'],
  'Other Veterinary Procedure': ['procedureName', 'visitDate', 'weight', 'procedureDetails', 'outcome', 'recommendations', 'notes'],
}

const LABELS = {
  visitDate: 'Visit Date', weight: 'Current Weight', temperature: 'Temperature', heartRate: 'Heart Rate', respiratoryRate: 'Respiratory Rate', bodyConditionScore: 'Body Condition Score', healthStatus: 'General Health Status', clinicalObservations: 'Clinical Observations', notes: 'Veterinarian Notes', followUpDate: 'Recommended Follow-up Date', vaccineName: 'Vaccine Name', manufacturer: 'Manufacturer', batchNumber: 'Batch Number', doseAdministered: 'Dose Administered', administrationRoute: 'Administration Route', injectionSite: 'Injection Site', nextVaccinationDue: 'Next Vaccination Due', observations: 'Observations', diagnosis: 'Diagnosis', symptomsObserved: 'Symptoms Observed', medication: 'Medication', dosage: 'Dosage', treatmentDuration: 'Treatment Duration', withdrawalPeriod: 'Withdrawal Period', treatmentOutcome: 'Treatment Outcome', heatDetectionDate: 'Heat Detection Date', semenBatchNumber: 'Semen Batch Number', bullId: 'Bull ID', technician: 'Technician', methodUsed: 'Method Used', pregnancyCheckDate: 'Pregnancy Check Date', pregnancyStatus: 'Pregnancy Status', estimatedGestation: 'Estimated Gestation', expectedCalvingDate: 'Expected Calving Date', recommendations: 'Recommendations', emergencyType: 'Emergency Type', clinicalFindings: 'Clinical Findings', immediateTreatmentGiven: 'Immediate Treatment Given', outcome: 'Outcome', referralRequired: 'Referral Required', procedureName: 'Procedure Name', procedureDetails: 'Procedure Details', currentWeight: 'Current Weight',
}

function fieldType(key) {
  if (key.toLowerCase().includes('date')) return 'date'
  if (['clinicalObservations', 'notes', 'symptomsObserved', 'observations', 'recommendations', 'clinicalFindings', 'immediateTreatmentGiven', 'procedureDetails'].includes(key)) return 'textarea'
  return 'text'
}

export function LogVisit({ farms, animals, onSave, onCancel, onOpenLookup, onOpenInspectionHistory, onLogout, onToggleTheme }) {
  const [farmId, setFarmId] = useState('')
  const [query, setQuery] = useState('')
  const [selectedAnimalId, setSelectedAnimalId] = useState(null)
  const [reason, setReason] = useState('')
  const [form, setForm] = useState({ visitDate: new Date().toISOString().slice(0, 10) })
  const selectedAnimal = animals.find((animal) => animal.id === selectedAnimalId)
  const filteredAnimals = useMemo(() => animals.filter((animal) => (!farmId || animal.farmId === farmId) && (!query.trim() || `${animal.id} ${animal.rfid}`.toLowerCase().includes(query.trim().toLowerCase()))), [animals, farmId, query])
  const farmName = (id) => farms.find((farm) => farm.id === id)?.name || 'Unknown farm'

  const navItems = getVeterinaryNavItems('log-visit', { onGoDashboard: onCancel, onOpenLookup, onOpenInspectionHistory, onGoNotBuilt: () => {} })
  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const submit = (event, draft = false) => {
    event.preventDefault()
    if (!selectedAnimal) return
    onSave(selectedAnimal.id, { ...form, reason: reason || 'Veterinary visit', healthStatus: form.healthStatus || selectedAnimal.healthStatus, summary: form.diagnosis || form.clinicalObservations || form.observations || form.notes || (draft ? 'Draft visit' : 'Visit recorded'), draft })
  }

  return (
    <DashboardShell roleLabel="VETERINARY" actorId="VT-000102" name="Dr. Achieng Otieno" navItems={navItems} onLogout={onLogout} onToggleTheme={onToggleTheme} variant="home">
      <div className="vet-page-head"><div><p className="setup-title">Log Visit</p><p className="setup-subtitle">Record veterinary examinations, treatments and procedures for animals under your care.</p></div></div>
      <div className="vet-auto-info"><span><b>Veterinarian</b> Dr. Achieng Otieno · VT-000102</span><span><b>Current date</b> {new Date().toLocaleDateString()} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span><b>Farm and animal</b> {selectedAnimal ? `${farmName(selectedAnimal.farmId)} · ${selectedAnimal.id}` : 'Populated after selection'}</span></div>
      <form onSubmit={submit}>
        <section className="vet-form-section"><h2>1. Select Farm</h2><label className="vet-field"><span>Select Farm</span><select value={farmId} onChange={(event) => { setFarmId(event.target.value); setSelectedAnimalId(null) }}><option value="">Choose a farm</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label></section>
        {farmId && <section className="vet-form-section"><h2>2. Select Animal</h2><div className="vet-search-actions"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter Animal BeefTrace ID" /><button type="button" className="btn btn-outline"><Icon size={15}>{IconPaths.qr}</Icon>Scan RFID</button></div><div className="vet-visit-animal-grid">{filteredAnimals.map((animal) => <button type="button" key={animal.id} className={`vet-visit-animal${selectedAnimalId === animal.id ? ' selected' : ''}`} onClick={() => setSelectedAnimalId(animal.id)}><div className="vet-visit-photo">{animal.photoUrl ? <img src={animal.photoUrl} alt={animal.id} /> : <Icon size={30}>{IconPaths.animal}</Icon>}</div><strong className="mono">{animal.id}</strong><span>{animal.breed || 'Breed not recorded'} · {animal.gender}</span><span>{animal.age || animal.dob || 'Age not recorded'} · {animal.healthStatus}</span><span className="btn btn-outline">Select</span></button>)}</div></section>}
        {selectedAnimal && <>
          <section className="vet-form-section"><h2>3. Animal Summary</h2><div className="vet-summary-card">{['Quarantined', 'On Medication', 'Under treatment'].includes(selectedAnimal.healthStatus) && <div className="vet-alert">{selectedAnimal.healthStatus === 'Quarantined' ? 'Animal currently under quarantine' : 'Animal currently on medication'}</div>}<div className="vet-summary-grid"><div className="vet-summary-photo">{selectedAnimal.photoUrl ? <img src={selectedAnimal.photoUrl} alt={selectedAnimal.id} /> : <Icon size={42}>{IconPaths.animal}</Icon>}</div><div><strong className="mono">{selectedAnimal.id}</strong><p>{selectedAnimal.breed || 'Breed not recorded'} · {selectedAnimal.gender} · {selectedAnimal.age || selectedAnimal.dob || 'Age not recorded'}</p><p>Farm: {farmName(selectedAnimal.farmId)} · Owner: {selectedAnimal.owner || 'Wanjiku Mwangi'}</p><p>Weight: {selectedAnimal.weight || 'Not recorded'} kg · Last visit: {selectedAnimal.vetVisits?.at(-1)?.date || 'None recorded'}</p><p>Last vaccination: {selectedAnimal.vaccinations?.at(-1) || 'None recorded'} · Medication: {selectedAnimal.treatments?.at(-1)?.medication || 'None recorded'}</p><span className="vet-status-badge vet-status-healthy">{selectedAnimal.healthStatus}</span></div></div></div></section>
          <section className="vet-form-section"><h2>4. Recent Veterinary History</h2><div className="vet-history-list">{(selectedAnimal.vetVisits || []).slice(-3).reverse().map((visit, index) => <div className="vet-history-row" key={`${visit.date}-${index}`}><strong>{visit.date}</strong><span>{visit.type || 'Veterinary visit'}</span><span>{visit.notes || 'No summary recorded'}</span></div>)}{!(selectedAnimal.vetVisits || []).length && <p className="vet-empty">No veterinary history recorded yet.</p>}</div></section>
          <section className="vet-form-section"><h2>5. Reason for Visit</h2><div className="vet-reason-grid">{REASONS.map((item) => <button type="button" key={item} className={`vet-reason-card${reason === item ? ' selected' : ''}`} onClick={() => setReason(item)}>{item}</button>)}</div></section>
          {reason && <section className="vet-form-section"><h2>{reason}</h2><div className="vet-form-grid">{FORM_FIELDS[reason].map((key) => <label className="vet-field" key={key}><span>{LABELS[key] || key}</span>{key === 'healthStatus' ? <select value={form[key] || ''} onChange={(event) => updateField(key, event.target.value)}><option value="">Select status</option><option>Healthy</option><option>Needs Attention</option><option>Critical</option></select> : key === 'referralRequired' ? <select value={form[key] || ''} onChange={(event) => updateField(key, event.target.value)}><option value="">Select</option><option>Yes</option><option>No</option></select> : fieldType(key) === 'textarea' ? <textarea value={form[key] || ''} onChange={(event) => updateField(key, event.target.value)} rows="3" /> : <input type={fieldType(key)} value={form[key] || ''} onChange={(event) => updateField(key, event.target.value)} />}</label>)}</div></section>}
          <div className="vet-bottom-actions"><button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button><button type="button" className="btn btn-outline" onClick={(event) => submit(event, true)}>Save Draft</button><button type="submit" className="btn btn-primary">Save to Records</button></div>
        </>}
      </form>
    </DashboardShell>
  )
}