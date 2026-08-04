// HealthRecordsScreen.jsx code
import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import { SetupActions, SectionTitle, TextInput, TextArea, FieldRow } from '../components/SetupBits'
import { getFarmerNavItems } from '../data/farmerNav'

export function HealthRecordsScreen({ onBack, onGoAnimalSetup, onToggleTheme, onLogout, ...navHandlers }) {
  const [activeChoice, setActiveChoice] = useState('')
  const [viewLookup, setViewLookup] = useState('')
  const [scheduleAnimalId, setScheduleAnimalId] = useState('')
  const [scheduleReason, setScheduleReason] = useState('')
  const [scheduleDetails, setScheduleDetails] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleAnother, setScheduleAnother] = useState(false)
  const [addMode, setAddMode] = useState('')
  const [weight, setWeight] = useState('')
  const [weightDate, setWeightDate] = useState('')
  const [animalIdOrRfid, setAnimalIdOrRfid] = useState('')
  const [vaccinationName, setVaccinationName] = useState('')
  const [vaccinationDate, setVaccinationDate] = useState('')
  const [treatmentDate, setTreatmentDate] = useState('')
  const [treatmentDetails, setTreatmentDetails] = useState('')
  const [vetName, setVetName] = useState('')
  const [vetId, setVetId] = useState('')
  const [vetNotes, setVetNotes] = useState('')
  const [visitDoctorName, setVisitDoctorName] = useState('')
  const [visitDoctorId, setVisitDoctorId] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [visitDetails, setVisitDetails] = useState('')

  const navItems = getFarmerNavItems('', navHandlers)

  const healthSummary = [
    { label: 'Animal ID', value: 'BT-000198' },
    { label: 'Current weight', value: '320 kg' },
    { label: 'Health status', value: 'Healthy' },
    { label: 'Last vaccination', value: 'FMD · 02 Jul 2026' },
    { label: 'Last vet visit', value: 'Routine check-up · 09 Jul 2026' },
  ]

  return (
    <DashboardShell
      roleLabel="FARMER"
      actorId="F-2026-0001"
      name="Wanjiku Mwangi"
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      variant="secondary"
      onGoHome={onBack}
    >
      <div className="setup-wrap" style={{ justifyContent: 'flex-start', paddingTop: 28 }}>
        <div className="setup-card">
          <p className="setup-title">Health & vaccination records</p>
          <p className="setup-subtitle">Choose how you want to manage your animals' health information.</p>

          <div className="setup-field-row" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`pill${activeChoice === 'view' ? ' pill-selected' : ''}`}
              style={{ flex: 1 }}
              onClick={() => setActiveChoice('view')}
            >
              View health and vaccination details
            </button>
            <button
              type="button"
              className={`pill${activeChoice === 'schedule' ? ' pill-selected' : ''}`}
              style={{ flex: 1 }}
              onClick={() => setActiveChoice('schedule')}
            >
              Schedule veterinary visit
            </button>
            <button
              type="button"
              className={`pill${activeChoice === 'add' ? ' pill-selected' : ''}`}
              style={{ flex: 1 }}
              onClick={() => setActiveChoice('add')}
            >
              Add health and vaccination details
            </button>
          </div>

          {activeChoice && (
            <div className="onboard-panel" style={{ marginTop: 8, paddingTop: 14, paddingBottom: 14 }}>
              {activeChoice === 'view' && (
                <>
                  <p className="onboard-heading">View health details</p>
                  <TextInput
                    label="Enter animal BeefTrace ID or RFID number"
                    placeholder="e.g. BT-000198 or RFID-000198"
                    value={viewLookup}
                    onChange={(e) => setViewLookup(e.target.value)}
                  />
                  {viewLookup && (
                    <div style={{ marginTop: 10 }}>
                      <p className="onboard-heading">Animal health summary</p>
                      <ul style={{ margin: '8px 0 0 18px', lineHeight: 1.6 }}>
                        {healthSummary.map((item) => (
                          <li key={item.label}><b>{item.label}:</b> {item.value}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {activeChoice === 'schedule' && (
                <>
                  <p className="onboard-heading">Schedule veterinary visit</p>
                  <TextInput
                    label="Enter animal BeefTrace ID or RFID number"
                    placeholder="e.g. BT-000198 or RFID-000198"
                    value={scheduleAnimalId}
                    onChange={(e) => setScheduleAnimalId(e.target.value)}
                  />
                  <TextInput
                    label="Reason for veterinary visit"
                    placeholder="e.g. Routine check-up"
                    value={scheduleReason}
                    onChange={(e) => setScheduleReason(e.target.value)}
                  />
                  <TextArea
                    label="Veterinary details"
                    placeholder="Describe symptoms, notes, or follow-up concerns"
                    value={scheduleDetails}
                    onChange={(e) => setScheduleDetails(e.target.value)}
                  />
                  <TextInput
                    label="Date for the visit"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                  <button type="button" className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => setScheduleAnother(true)}>
                    Schedule another visit
                  </button>
                  {scheduleAnother && (
                    <div style={{ marginTop: 12 }}>
                      <p className="onboard-heading">Additional visit</p>
                      <TextInput label="Animal ID" placeholder="e.g. BT-000245" />
                    </div>
                  )}
                </>
              )}

              {activeChoice === 'add' && (
                <>
                  <p className="onboard-heading">Add health details</p>
                  <div className="setup-field-row" style={{ marginBottom: 8 }}>
                    <button type="button" className={`pill${addMode === 'weight' ? ' pill-selected' : ''}`} style={{ flex: 1 }} onClick={() => setAddMode('weight')}>Update weight</button>
                    <button type="button" className={`pill${addMode === 'vaccination' ? ' pill-selected' : ''}`} style={{ flex: 1 }} onClick={() => setAddMode('vaccination')}>Add vaccination details</button>
                    <button type="button" className={`pill${addMode === 'disease' ? ' pill-selected' : ''}`} style={{ flex: 1 }} onClick={() => setAddMode('disease')}>Add disease records</button>
                    <button type="button" className={`pill${addMode === 'visit' ? ' pill-selected' : ''}`} style={{ flex: 1 }} onClick={() => setAddMode('visit')}>Add veterinary visit records</button>
                  </div>

                  {addMode === 'weight' && (
                    <>
                      <SectionTitle>Update weight</SectionTitle>
                      <TextInput
                        label="Enter animal BeefTrace ID or RFID number"
                        placeholder="e.g. BT-000198 or RFID-000198"
                        value={animalIdOrRfid}
                        onChange={(e) => setAnimalIdOrRfid(e.target.value)}
                      />
                      <FieldRow>
                        <TextInput label="Current weight" type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
                        <TextInput label="Date weight recorded" type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)} />
                      </FieldRow>
                    </>
                  )}

                  {addMode === 'vaccination' && (
                    <>
                      <SectionTitle>Add vaccination details</SectionTitle>
                      <TextInput
                        label="Enter animal BeefTrace ID or RFID number"
                        placeholder="e.g. BT-000198 or RFID-000198"
                        value={animalIdOrRfid}
                        onChange={(e) => setAnimalIdOrRfid(e.target.value)}
                      />
                      <div style={{ marginTop: 12 }}>
                        <SectionTitle>Update weight</SectionTitle>
                        <FieldRow>
                          <TextInput label="Current weight" type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
                          <TextInput label="Date weight recorded" type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)} />
                        </FieldRow>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <SectionTitle>Vaccine details</SectionTitle>
                        <TextInput label="Vaccine name" placeholder="e.g. FMD" value={vaccinationName} onChange={(e) => setVaccinationName(e.target.value)} />
                        <TextInput label="Date administered" type="date" value={vaccinationDate} onChange={(e) => setVaccinationDate(e.target.value)} />
                      </div>
                    </>
                  )}

                  {addMode === 'disease' && (
                    <>
                      <SectionTitle>Add disease records</SectionTitle>
                      <TextInput
                        label="Enter animal BeefTrace ID or RFID number"
                        placeholder="e.g. BT-000198 or RFID-000198"
                        value={animalIdOrRfid}
                        onChange={(e) => setAnimalIdOrRfid(e.target.value)}
                      />
                      <div style={{ marginTop: 12 }}>
                        <SectionTitle>Update weight</SectionTitle>
                        <FieldRow>
                          <TextInput label="Current weight" type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
                          <TextInput label="Date weight recorded" type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)} />
                        </FieldRow>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <SectionTitle>Treatment administered details</SectionTitle>
                        <TextArea label="Diseases experienced" placeholder="e.g. East Coast Fever (2025)" />
                        <TextArea
                          label="Treatment administered details"
                          placeholder="Describe the treatment, dosage, and follow-up guidance"
                          value={treatmentDetails}
                          onChange={(e) => setTreatmentDetails(e.target.value)}
                        />
                        <TextInput label="Date treatment given" type="date" value={treatmentDate} onChange={(e) => setTreatmentDate(e.target.value)} />
                        <FieldRow>
                          <TextInput label="Veterinary doctor name" placeholder="e.g. Dr. Wanjiku" value={vetName} onChange={(e) => setVetName(e.target.value)} />
                          <TextInput label="Veterinary doctor ID" placeholder="e.g. VT-102" value={vetId} onChange={(e) => setVetId(e.target.value)} />
                        </FieldRow>
                        <TextArea
                          label="Veterinary doctor's notes"
                          placeholder="Add any observations or advice from the attending veterinarian"
                          value={vetNotes}
                          onChange={(e) => setVetNotes(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {addMode === 'visit' && (
                    <>
                      <SectionTitle>Add veterinary visit records</SectionTitle>
                      <TextInput
                        label="Enter animal BeefTrace ID or RFID number"
                        placeholder="e.g. BT-000198 or RFID-000198"
                        value={animalIdOrRfid}
                        onChange={(e) => setAnimalIdOrRfid(e.target.value)}
                      />
                      <div style={{ marginTop: 12 }}>
                        <SectionTitle>Update weight</SectionTitle>
                        <FieldRow>
                          <TextInput label="Current weight" type="number" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
                          <TextInput label="Date weight recorded" type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)} />
                        </FieldRow>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <SectionTitle>Veterinary visit details</SectionTitle>
                        <FieldRow>
                          <TextInput label="Veterinary doctor name" placeholder="e.g. Dr. Otieno" value={visitDoctorName} onChange={(e) => setVisitDoctorName(e.target.value)} />
                          <TextInput label="BeefTrace ID" placeholder="e.g. BT-VET-002" value={visitDoctorId} onChange={(e) => setVisitDoctorId(e.target.value)} />
                        </FieldRow>
                        <TextInput label="Date" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
                        <TextArea label="Details about visit" placeholder="Summary of findings, treatments, and follow-up" value={visitDetails} onChange={(e) => setVisitDetails(e.target.value)} />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          <SetupActions>
            <button className="btn btn-outline" onClick={onBack}>
              Return to dashboard
            </button>
            {activeChoice === 'schedule' && (
              <button className="btn btn-primary" onClick={() => setActiveChoice('') }>
                Complete schedule
              </button>
            )}
            {activeChoice === 'add' && (
              <button className="btn btn-primary" onClick={onGoAnimalSetup}>
                Add details
              </button>
            )}
          </SetupActions>
        </div>
      </div>
    </DashboardShell>
  )
}
