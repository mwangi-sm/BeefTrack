import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEED_FARMS, SEED_ANIMALS } from '../data/farmerSeedData'

// Owns all Farmer state (farms, animals, onboarding progress) and every Farmer
// navigation/action handler. Called once in App.jsx; the returned values are
// passed to each route element as props.
//
// `basePath` is where FarmerRoutes is actually mounted (e.g. "/dashboard/farmer").
// Every navigate() call below is built from it rather than hardcoded, since
// this hook is called above the <Routes> tree — relative navigation from here
// wouldn't reliably resolve to wherever FarmerRoutes ends up mounted.
export function useFarmerFlow(basePath) {
  const navigate = useNavigate()
  const [farmerSetup, setFarmerSetup] = useState({ profile: false, farm: false, animal: false })
  const [farms, setFarms] = useState(SEED_FARMS)
  const [animals, setAnimals] = useState(SEED_ANIMALS)
  const [traceabilityHistory, setTraceabilityHistory] = useState([])

  const goFarmerDashboard = () => navigate(basePath)
  const goFarmerProfileSetup = () => navigate(`${basePath}/setup/profile`)
  const goFarmerFarmSetup = () => navigate(`${basePath}/setup/farm`)
  const goFarmerAnimalSetup = () => navigate(`${basePath}/setup/animal`)
  const goFarmerHealthRecords = () => navigate(`${basePath}/health-records`)
  const goMyFarms = () => navigate(`${basePath}/farms`)
  const goFarmDetails = (farmId) => navigate(`${basePath}/farms/${farmId}`)
  const goManageFarm = (farmId) => navigate(`${basePath}/farms/${farmId}/manage`)
  const goMyAnimals = () => navigate(`${basePath}/animals`)
  const goAnimalDetails = (animalId) => navigate(`${basePath}/animals/${animalId}`)
  const goFarmerNotBuilt = () => navigate(`${basePath}/not-built`)
  const goFarmerTraceability = () => navigate(`${basePath}/traceability`)
  const goFarmerTraceabilityHistory = () => navigate(`${basePath}/traceability/history`)
  const recordTraceabilityLookup = (value) => {
    setTraceabilityHistory((prev) => [...prev, { value, timestamp: new Date().toLocaleString() }])
  }

  const handleFarmerProfileComplete = () => {
    setFarmerSetup((prev) => ({ ...prev, profile: true }))
    goFarmerFarmSetup()
  }

  const saveNewFarm = (newFarm) => {
    if (!newFarm) return
    const county = (newFarm.sub || '').split(' · ')[0] || ''
    const richFarm = {
      id: `FM-${1030 + farms.length}`,
      name: newFarm.name,
      county,
      subCounty: '',
      ward: '',
      village: '',
      gps: '',
      ownership: '',
      size: '',
      waterSource: '',
      feedSources: [],
      practice: '',
      workers: '',
      vetName: '',
      vetNumber: '',
      photosCount: 0,
    }
    setFarms((prev) => [richFarm, ...prev])
  }

  const handleFarmSubmitAndGoAnimal = (newFarm) => {
    saveNewFarm(newFarm)
    setFarmerSetup((prev) => ({ ...prev, farm: true }))
    goFarmerAnimalSetup()
  }

  const handleFarmSubmitAndGoDashboard = (newFarm) => {
    saveNewFarm(newFarm)
    setFarmerSetup((prev) => ({ ...prev, farm: true }))
    goFarmerDashboard()
  }

  const handleAnimalSubmit = () => {
    setFarmerSetup((prev) => ({ ...prev, animal: true }))
    goFarmerDashboard()
  }

  const handleSaveFarm = (updatedFarm) => {
    setFarms((prev) => prev.map((f) => (f.id === updatedFarm.id ? updatedFarm : f)))
    goFarmDetails(updatedFarm.id)
  }

  const handleRecordInspection = (animalId, visit) => {
    setAnimals((prev) =>
      prev.map((a) =>
        a.id === animalId
          ? { ...a, healthStatus: visit.healthStatus, vetVisits: [...(a.vetVisits || []), visit] }
          : a
      )
    )
  }

  const handleSaveVeterinaryVisit = (animalId, visit) => {
    setAnimals((prev) => prev.map((animal) => {
      if (animal.id !== animalId) return animal
      const nextAnimal = {
        ...animal,
        healthStatus: visit.healthStatus || animal.healthStatus,
        weight: visit.weight || animal.weight,
        weightHistory: visit.weight ? [...(animal.weightHistory || []), { date: visit.visitDate, weight: visit.weight }] : animal.weightHistory,
        vetVisits: [...(animal.vetVisits || []), {
          date: visit.visitDate,
          vetName: 'Dr. Achieng Otieno',
          notes: visit.summary,
          healthStatus: visit.healthStatus || animal.healthStatus,
        }],
        inspections: [...(animal.inspections || []), {
          date: visit.visitDate,
          type: visit.reason,
          vetName: 'Dr. Achieng Otieno',
          notes: visit.summary,
          healthStatus: visit.healthStatus || animal.healthStatus,
          ...visit,
        }],
      }
      if (visit.reason === 'Vaccination' && visit.vaccineName) {
        nextAnimal.vaccinations = [...(animal.vaccinations || []), visit.vaccineName]
      }
      if (visit.reason === 'Disease Treatment' && visit.medication) {
        nextAnimal.treatments = [...(animal.treatments || []), {
          medication: visit.medication,
          dosage: visit.dosage,
          veterinarian: 'Dr. Achieng Otieno',
          startDate: visit.visitDate,
          status: visit.treatmentOutcome || 'Active',
        }]
      }
      if (visit.reason === 'Disease Treatment' && visit.diagnosis) {
        nextAnimal.diseaseRecords = [...(animal.diseaseRecords || []), { date: visit.visitDate, diagnosis: visit.diagnosis, notes: visit.symptomsObserved }]
      }
      if (visit.reason === 'Pregnancy Examination') {
        nextAnimal.pregnancyRecords = [...(animal.pregnancyRecords || []), { date: visit.visitDate, ...visit }]
      }
      if (visit.reason === 'Artificial Insemination') {
        nextAnimal.artificialInseminations = [...(animal.artificialInseminations || []), { date: visit.visitDate, ...visit }]
      }
      return nextAnimal
    }))
  }

  const navHandlers = {
    onGoHome: goFarmerDashboard,
    onGoFarmSetup: goFarmerFarmSetup,
    onGoAnimalSetup: goFarmerAnimalSetup,
    onGoMyFarms: goMyFarms,
    onGoMyAnimals: goMyAnimals,
    onGoHealthRecords: goFarmerHealthRecords,
    onGoNotBuilt: goFarmerNotBuilt,
  }

  return {
    farms,
    animals,
    farmerSetup,
    navHandlers,
    goFarmerDashboard,
    goFarmerProfileSetup,
    goFarmerFarmSetup,
    goFarmerAnimalSetup,
    goFarmerHealthRecords,
    goMyFarms,
    goFarmDetails,
    goManageFarm,
    goMyAnimals,
    goAnimalDetails,
    goFarmerNotBuilt,
    goFarmerTraceability,
    goFarmerTraceabilityHistory,
    traceabilityHistory,
    recordTraceabilityLookup,
    handleFarmerProfileComplete,
    handleFarmSubmitAndGoAnimal,
    handleFarmSubmitAndGoDashboard,
    handleAnimalSubmit,
    handleSaveFarm,
    handleRecordInspection,
    handleSaveVeterinaryVisit,
  }
}