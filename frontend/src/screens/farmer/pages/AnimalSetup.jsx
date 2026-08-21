//AnimalSetup.jsx code
import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import {
  SectionTitle, TextInput, SelectInput, TextArea,
  PillGroup, FieldRow, FileInput, SetupActions,
} from '../components/SetupBits'
import { getFarmerNavItems } from '../data/farmerNav'

const importableAnimal = {
  rfid: 'RFID-000198',
  alternativeId: 'Ear tattoo KH-22',
  dateOfBirth: '2024-03-15',
  gender: 'Female',
  breed: 'Boran',
  birthFarm: 'Kiambu Highlands Farm',
  currentFarm: 'Kiambu Highlands Farm',
  dateAcquired: '2025-01-10',
  healthStatus: 'Healthy',
  currentWeight: '320',
  dateWeightRecorded: '2025-03-15',
  vaccinationHistory: ['FMD', 'Anthrax'],
  diseasesHistory: [
    { id: 'd1', name: 'East Coast Fever', date: '2025-02-10', doctorName: 'Dr. Wanjiku', doctorId: 'VT-102' }
  ],
}

const createVaccineRecord = () => ({ id: Date.now() + Math.random(), name: '', date: '' })
const createDiseaseRecord = () => ({ id: Date.now() + Math.random(), name: '', date: '', doctorName: '', doctorId: '' })

export function AnimalSetup({ farms, onGoFarm, onFinish, onCancel, onToggleTheme, onLogout, ...navHandlers }) {
  const [farmChoice, setFarmChoice] = useState('existing')
  const [selectedFarm, setSelectedFarm] = useState('Select farm')
  const [source, setSource] = useState('')
  const [previousFarmerInSystem, setPreviousFarmerInSystem] = useState('')
  const [vaccinationRecords, setVaccinationRecords] = useState([createVaccineRecord()])
  const [diseaseRecords, setDiseaseRecords] = useState([createDiseaseRecord()])
  const [showFarmPicker, setShowFarmPicker] = useState(true)
  const navItems = getFarmerNavItems('', navHandlers)

  const [formValues, setFormValues] = useState({
    rfid: '',
    alternativeId: '',
    dateOfBirth: '',
    gender: '',
    breed: '',
    birthFarm: '',
    currentFarm: '',
    dateAcquired: '',
    healthStatus: '',
    currentWeight: '',
    dateWeightRecorded: '',
    veterinaryVisitDoctorName: '',
    veterinaryVisitBeefTraceId: '',
    veterinaryVisitDate: '',
    veterinaryVisitDetails: '',
    previousOwnerName: '',
    farmerBeefTraceId: '',
    previousAnimalBeefTraceId: '',
    farmerNationalId: '',
    previousOwnerFarmName: '',
    previousOwnerFarmLocation: '',
    breedingReproductiveStatus: '',
    calvesReproduced: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onFinish()
  }

  const handleFarmChoice = (choice) => {
    if (choice === 'new') {
      onGoFarm()
      return
    }
    setFarmChoice(choice)
    setSelectedFarm('Select')
    setShowFarmPicker(true)
  }

  const handleFarmSelect = (farmName) => {
    setSelectedFarm(farmName)
    if (farmName !== 'Select') {
      setFormValues((prev) => ({ ...prev, currentFarm: farmName }))
      setShowFarmPicker(false)
    }
  }

  const handleOriginChoice = (value) => {
    setSource(value)
    setPreviousFarmerInSystem('')
    setVaccinationRecords([createVaccineRecord()])
    setDiseaseRecords([createDiseaseRecord()])

    setFormValues((prev) => ({
      ...prev,
      rfid: '',
      alternativeId: '',
      dateOfBirth: '',
      gender: '',
      breed: '',
      birthFarm: '',
      dateAcquired: '',
      healthStatus: '',
      currentWeight: '',
      dateWeightRecorded: '',
      veterinaryVisitDoctorName: '',
      veterinaryVisitBeefTraceId: '',
      veterinaryVisitDate: '',
      veterinaryVisitDetails: '',
      previousOwnerName: '',
      farmerBeefTraceId: '',
      previousAnimalBeefTraceId: '',
      farmerNationalId: '',
      previousOwnerFarmName: '',
      previousOwnerFarmLocation: '',
      breedingReproductiveStatus: '',
      calvesReproduced: '',
    }))
  }

  const updateField = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const updateVaccineEntry = (id, field, value) => {
    setVaccinationRecords((prev) => prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)))
  }

  const addVaccineEntry = () => {
    setVaccinationRecords((prev) => [...prev, createVaccineRecord()])
  }

  const updateDiseaseEntry = (id, field, value) => {
    setDiseaseRecords((prev) => prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)))
  }

  const addDiseaseEntry = () => {
    setDiseaseRecords((prev) => [...prev, createDiseaseRecord()])
  }

  const handleImport = () => {
    setVaccinationRecords(
      importableAnimal.vaccinationHistory.map((item) => ({
        id: `${item}-${Math.random()}`,
        name: item,
        date: '',
      }))
    )
    setDiseaseRecords(
      importableAnimal.diseasesHistory.map((item) => ({
        id: `${item.name}-${Math.random()}`,
        name: item.name,
        date: item.date,
        doctorName: item.doctorName,
        doctorId: item.doctorId
      }))
    )
    setFormValues((prev) => ({
      ...prev,
      rfid: importableAnimal.rfid,
      alternativeId: importableAnimal.alternativeId,
      dateOfBirth: importableAnimal.dateOfBirth,
      gender: importableAnimal.gender,
      breed: importableAnimal.breed,
      birthFarm: importableAnimal.birthFarm,
      currentFarm: prev.currentFarm || importableAnimal.currentFarm,
      dateAcquired: importableAnimal.dateAcquired,
      healthStatus: importableAnimal.healthStatus,
      currentWeight: importableAnimal.currentWeight,
      dateWeightRecorded: importableAnimal.dateWeightRecorded,
    }))
  }

  const showPurchaseFlow = source === 'Purchased/Transferred'
  const showBreedingInfo = formValues.gender === 'Female'
  const showHealthRecords = source === 'Born on farm' || (showPurchaseFlow && previousFarmerInSystem !== '')

  return (
    <DashboardShell
      roleLabel="FARMER"
      actorId="F-2026-0001"
      name="Wanjiku Mwangi"
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      variant="secondary"
      onGoHome={onCancel}
    >
      <div className="setup-wrap" style={{ justifyContent: 'flex-start', paddingTop: 28 }}>
        <div className="setup-card">
          <p className="setup-title">Enroll New Animal</p>
          <p className="setup-subtitle">Register an animal against one of your farms.</p>

          <div className="setup-progress" aria-label="Animal enrollment progress">
            <span className="setup-progress-step active">1. Farm</span>
            <span className="setup-progress-step">2. Identity</span>
            <span className="setup-progress-step">3. Health</span>
            <span className="setup-progress-step">4. Review</span>
          </div>

          <div className="setup-field-row" style={{ marginBottom: 18 }}>
            <button
              type="button"
              className={`pill${farmChoice === 'existing' ? ' pill-selected' : ''}`}
              style={{ flex: 1 }}
              onClick={() => handleFarmChoice('existing')}
            >
              Enroll to existing farm
            </button>
            <button
              type="button"
              className={`pill${farmChoice === 'new' ? ' pill-selected' : ''}`}
              style={{ flex: 1 }}
              onClick={() => handleFarmChoice('new')}
            >
              Enroll to new farm
            </button>
          </div>

          {showFarmPicker && farmChoice === 'existing' && (
            <div className="onboard-panel" style={{ marginBottom: 18 }}>
              <p className="onboard-heading">Select the farm</p>
              <SelectInput
                label="Select farm"
                options={['Select farm', ...farms.map((f) => f.name)]}
                value={selectedFarm}
                onChange={(e) => handleFarmSelect(e.target.value)}
                hint="This animal will be enrolled under the selected farm."
              />
            </div>
          )}

          {!showFarmPicker && selectedFarm && selectedFarm !== 'select_farm' && (
            <div className="onboard-complete" style={{ marginBottom: 24 }}>
              <span>Farm selected: {selectedFarm}</span>
            </div>
          )}

          {!showFarmPicker && selectedFarm !== 'select_farm' && (
            <form onSubmit={handleSubmit}>
              <SectionTitle>Origin information</SectionTitle>
              <PillGroup
                label="Source of animal"
                options={['Born on farm', 'Purchased/Transferred']}
                value={source}
                onChange={handleOriginChoice}
              />

              {source === 'Born on farm' && (
                <>
                  <SectionTitle>Animal identification</SectionTitle>
                  <FieldRow>
                    <TextInput
                      label="RFID tag number"
                      placeholder="e.g. RFID-000198"
                      value={formValues.rfid}
                      onChange={(e) => updateField('rfid', e.target.value)}
                    />
                    <TextInput
                      label="Alternative identification (tattoo, brand mark)"
                      placeholder="e.g. Ear tattoo KH-22"
                      value={formValues.alternativeId}
                      onChange={(e) => updateField('alternativeId', e.target.value)}
                    />
                  </FieldRow>

                  <SectionTitle>Basic animal details</SectionTitle>
                  <FieldRow>
                    <TextInput
                      label="Date of birth"
                      type="date"
                      value={formValues.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    />
                    <SelectInput
                      label="Gender"
                      options={['Female', 'Male']}
                      value={formValues.gender}
                      onChange={(e) => updateField('gender', e.target.value)}
                    />
                  </FieldRow>
                  <SelectInput
                    label="Breed"
                    options={['Boran', 'Sahiwal', 'Zebu', 'Brahman', 'Gir', 'Girolando', 'Beef on dairy e.g. Freshian, Ayrshire, Guernsey or Jersey ', 'Exotic breeds', 'Crossbreed']}
                    value={formValues.breed}
                    onChange={(e) => updateField('breed', e.target.value)}
                  />
                </>
              )}

              {showPurchaseFlow && (
                <>
                  <SectionTitle>Previous farmer in BeefTrace?</SectionTitle>
                  <PillGroup
                    label="Is the previous farmer part of BeefTrace?"
                    options={['Yes', 'No']}
                    value={previousFarmerInSystem}
                    onChange={(value) => {
                      setPreviousFarmerInSystem(value)
                    }}
                  />

                  {previousFarmerInSystem === 'Yes' && (
                    <>
                      <SectionTitle></SectionTitle>
                      <FieldRow>
                        <TextInput
                          label="Date acquired"
                          type="date"
                          value={formValues.dateacquired}
                          onChange={(e) => updateField('dateacquired', e.target.value)}
                        />
                      </FieldRow>
                      <SectionTitle>Import data</SectionTitle>
                      <FieldRow>
                        <TextInput
                        label="Animal's previous BeefTrace ID"
                        placeholder="e.g. BT-000412"
                        value={formValues.previousAnimalBeefTraceId}
                        onChange={(e) => updateField('previousAnimalBeefTraceId', e.target.value)}
                      />
                      </FieldRow>
                      <div className="setup-actions" style={{ marginTop: 8, paddingTop: 8, marginBottom: 16 }}>
                        <button type="button" className="btn btn-primary" onClick={handleImport}>
                          Import animal details
                        </button>
                      </div>

                      <SectionTitle>Previous owner and farm details</SectionTitle>
                      <FieldRow>
                        <TextInput
                          label="Previous owner name"
                          placeholder="e.g. Jane Njeri"
                          value={formValues.previousOwnerName}
                          onChange={(e) => updateField('previousOwnerName', e.target.value)}
                        />
                        <TextInput
                          label="Previous Owner BeefTrace ID"
                          placeholder="e.g. F-2026-0003"
                          value={formValues.farmerBeefTraceId}
                          onChange={(e) => updateField('farmerBeefTraceId', e.target.value)}
                        />
                      </FieldRow>
                      <FieldRow>
                        <TextInput
                          label="Previous owner farm name"
                          placeholder="e.g. Kiambu Highlands Farm"
                          value={formValues.previousOwnerFarmName}
                          onChange={(e) => updateField('previousOwnerFarmName', e.target.value)}
                        />
                        <TextInput
                          label="Previous owner farm location"
                          placeholder="e.g. Kiambu County"
                          value={formValues.previousOwnerFarmLocation}
                          onChange={(e) => updateField('previousOwnerFarmLocation', e.target.value)}
                        />
                      </FieldRow>
                    </>
                  )}

                  {previousFarmerInSystem === 'No' && (
                    <>
                      <SectionTitle>Previous Owner details</SectionTitle>
                      <FieldRow>
                        <TextInput
                          label="Previous owner name"
                          placeholder="e.g. Jane Njeri"
                          value={formValues.previousOwnerName}
                          onChange={(e) => updateField('previousOwnerName', e.target.value)}
                        />
                        <TextInput
                          label="Previous owner national ID number"
                          placeholder="e.g. 34567890"
                          value={formValues.farmerNationalId}
                          onChange={(e) => updateField('farmerNationalId', e.target.value)}
                        />
                      </FieldRow>
                      <FieldRow>
                        <TextInput
                          label="Previous owner farm name"
                          placeholder="e.g. Kiambu Highlands Farm"
                          value={formValues.previousOwnerFarmName}
                          onChange={(e) => updateField('previousOwnerFarmName', e.target.value)}
                        />
                        <TextInput
                          label="Previous owner farm location"
                          placeholder="e.g. Kiambu County"
                          value={formValues.previousOwnerFarmLocation}
                          onChange={(e) => updateField('previousOwnerFarmLocation', e.target.value)}
                        />
                      </FieldRow>
                      <FieldRow>
                        <TextInput
                          label="Date acquired"
                          type="date"
                          value={formValues.dateacquired}
                          onChange={(e) => updateField('dateacquired', e.target.value)}
                        />
                      </FieldRow>
                    </>
                  )}

                  {(previousFarmerInSystem === 'Yes' || previousFarmerInSystem === 'No') && (
                    <>
                      <SectionTitle>Animal identification</SectionTitle>
                      <FieldRow>
                        <TextInput
                          label="RFID tag number"
                          placeholder="e.g. RFID-000198"
                          value={formValues.rfid}
                          onChange={(e) => updateField('rfid', e.target.value)}
                        />
                        <TextInput
                          label="Alternative identification (tattoo, brand mark)"
                          placeholder="e.g. Ear tattoo KH-22"
                          value={formValues.alternativeId}
                          onChange={(e) => updateField('alternativeId', e.target.value)}
                        />
                      </FieldRow>

                      <SectionTitle>Basic animal details</SectionTitle>
                      <FieldRow>
                        <TextInput
                          label="Date of birth"
                          type="date"
                          value={formValues.dateOfBirth}
                          onChange={(e) => updateField('dateOfBirth', e.target.value)}
                        />
                        <SelectInput
                          label="Gender"
                          options={['Female', 'Male']}
                          value={formValues.gender}
                          onChange={(e) => updateField('gender', e.target.value)}
                        />
                      </FieldRow>
                      <SelectInput
                        label="Breed"
                        options={['Boran', 'Sahiwal', 'Zebu', 'Brahman', 'Gir', 'Girolando', 'Beef on dairy e.g. Freshian, Ayrshire, Guernsey or Jersey ', 'Exotic breeds', 'Crossbreed']}
                        value={formValues.breed}
                        onChange={(e) => updateField('breed', e.target.value)}
                      />
                    </>
                  )}
                </>
              )}

              {showBreedingInfo && (
                <>
                  <SectionTitle>Breeding info</SectionTitle>
                  <SelectInput
                    label="Reproductive status"
                    options={['Has reproduced', 'Has not reproduced']}
                    value={formValues.breedingReproductiveStatus}
                    onChange={(e) => updateField('breedingReproductiveStatus', e.target.value)}
                  />
                  {formValues.breedingReproductiveStatus === 'Has reproduced' && (
                    <TextInput
                      label="Number of calves reproduced"
                      type="number"
                      min="0"
                      value={formValues.calvesReproduced}
                      onChange={(e) => updateField('calvesReproduced', e.target.value)}
                    />
                  )}
                </>
              )}

              {showHealthRecords && (
                <>
                  <SectionTitle>Health records</SectionTitle>
                  <FieldRow>
                    <TextInput
                      label="Current weight"
                      type="number"
                      min="0"
                      value={formValues.currentWeight}
                      onChange={(e) => updateField('currentWeight', e.target.value)}
                    />
                    <TextInput
                      label="Date weight recorded"
                      type="date"
                      value={formValues.dateWeightRecorded}
                      onChange={(e) => updateField('dateWeightRecorded', e.target.value)}
                    />
                  </FieldRow>
                  <SelectInput
                    label="Current health status"
                    options={['Healthy', 'Under treatment', 'Sick', 'Quarantined', 'Deceased']}
                    value={formValues.healthStatus}
                    onChange={(e) => updateField('healthStatus', e.target.value)}
                  />

                  <div className="onboard-panel" style={{ marginTop: 12, paddingTop: 14, paddingBottom: 14 }}>
                    <p className="onboard-heading" style={{ marginBottom: 10 }}>Vaccination history</p>
                    {vaccinationRecords.map((entry) => (
                      <div key={entry.id} style={{ marginBottom: 14, borderBottom: '1px dashed #eee', paddingBottom: 10 }}>
                        <TextInput
                          label="Vaccine name"
                          placeholder="e.g. FMD"
                          value={entry.name}
                          onChange={(e) => updateVaccineEntry(entry.id, 'name', e.target.value)}
                        />
                        <TextInput
                          label="Date administered"
                          type="date"
                          value={entry.date}
                          onChange={(e) => updateVaccineEntry(entry.id, 'date', e.target.value)}
                        />
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline" onClick={addVaccineEntry}>
                      + Add another vaccine
                    </button>
                  </div>

                  <div className="onboard-panel" style={{ marginTop: 16, paddingTop: 14, paddingBottom: 14 }}>
                    <p className="onboard-heading" style={{ marginBottom: 10 }}>Disease history</p>
                    {diseaseRecords.map((entry) => (
                      <div key={entry.id} style={{ marginBottom: 14, borderBottom: '1px dashed #eee', paddingBottom: 10 }}>
                        <TextArea
                          label="Disease experienced"
                          placeholder="e.g. East Coast Fever"
                          value={entry.name}
                          onChange={(e) => updateDiseaseEntry(entry.id, 'name', e.target.value)}
                        />
                        <FieldRow>
                          <TextInput
                            label="Date treatment given"
                            type="date"
                            value={entry.date}
                            onChange={(e) => updateDiseaseEntry(entry.id, 'date', e.target.value)}
                          />
                          <TextInput
                            label="Veterinary doctor name"
                            placeholder="e.g. Dr. Wanjiku"
                            value={entry.doctorName}
                            onChange={(e) => updateDiseaseEntry(entry.id, 'doctorName', e.target.value)}
                          />
                        </FieldRow>
                        <TextInput
                          label="Veterinary doctor ID"
                          placeholder="e.g. VT-102"
                          value={entry.doctorId}
                          onChange={(e) => updateDiseaseEntry(entry.id, 'doctorId', e.target.value)}
                        />
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline" onClick={addDiseaseEntry}>
                      + Add another disease
                    </button>
                  </div>

                  <div className="onboard-panel" style={{ marginTop: 16, paddingTop: 14, paddingBottom: 14 }}>
                    <p className="onboard-heading" style={{ marginBottom: 10 }}>Veterinary visits</p>
                    <FieldRow>
                      <TextInput
                        label="Veterinary doctor name"
                        placeholder="e.g. Dr. Otieno"
                        value={formValues.veterinaryVisitDoctorName}
                        onChange={(e) => updateField('veterinaryVisitDoctorName', e.target.value)}
                      />
                      <TextInput
                        label="BeefTrace ID"
                        placeholder="e.g. BT-VET-002"
                        value={formValues.veterinaryVisitBeefTraceId}
                        onChange={(e) => updateField('veterinaryVisitBeefTraceId', e.target.value)}
                      />
                    </FieldRow>
                    <TextInput
                      label="Date"
                      type="date"
                      value={formValues.veterinaryVisitDate}
                      onChange={(e) => updateField('veterinaryVisitDate', e.target.value)}
                    />
                    <TextArea
                      label="Details about visit"
                      placeholder="Summary of findings, treatments, and follow-up"
                      value={formValues.veterinaryVisitDetails}
                      onChange={(e) => updateField('veterinaryVisitDetails', e.target.value)}
                    />
                  </div>
                  <FileInput label="Upload disease test results" hint="Optional — lab reports or test certificates." />
                </>
              )}

              <SetupActions>
                <button className="btn btn-primary" type="submit" style={{ flex: 'none', minWidth: '100%' }}>
                  Complete animal enrollment
                </button>
              </SetupActions>
            </form>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
