// FarmerRoutes.jsx code
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { FarmerDashboard } from './FarmerDashboard'
import { FarmerProfileSetup } from './FarmerProfileSetup'
import { FarmSetup } from './FarmSetup'
import { AnimalSetup } from './AnimalSetup'
import { HealthRecordsScreen } from './HealthRecordsScreen'
import { MyFarms } from './MyFarms'
import { FarmDetails } from './FarmDetails'
import { ManageFarm } from './ManageFarm'
import { MyAnimals } from './MyAnimals'
import { AnimalDetails } from './AnimalDetails'
import { Placeholder } from '../../public/StaticScreens'
import { FarmerTraceabilityHistory, FarmerTraceabilityLookup } from './FarmerTraceabilityLookup'
import { FarmerNotifications } from './FarmerNotifications'
import { FarmerProfile } from './FarmerProfile'
import { FarmerSales } from './FarmerSales'
import { FarmerSettings } from './FarmerSettings'

function FarmDetailsPage({ flow, onToggleTheme, onLogout }) {
  const { farmId } = useParams()
  const farm = flow.farms.find((f) => f.id === farmId)
  if (!farm) return <Navigate to="../farms" replace />
  return (
    <FarmDetails
      farm={farm}
      animals={flow.animals}
      onManageFarm={flow.goManageFarm}
      onOpenAnimal={flow.goAnimalDetails}
      onToggleTheme={onToggleTheme}
      onLogout={onLogout}
      {...flow.navHandlers}
    />
  )
}

function ManageFarmPage({ flow, onToggleTheme, onLogout }) {
  const { farmId } = useParams()
  const farm = flow.farms.find((f) => f.id === farmId)
  if (!farm) return <Navigate to="../../farms" replace />
  return (
    <ManageFarm
      farm={farm}
      onSave={flow.handleSaveFarm}
      onCancel={() => flow.goFarmDetails(farm.id)}
      onToggleTheme={onToggleTheme}
      onLogout={onLogout}
      {...flow.navHandlers}
    />
  )
}

function AnimalDetailsPage({ flow, onToggleTheme, onLogout }) {
  const { animalId } = useParams()
  const animal = flow.animals.find((a) => a.id === animalId)
  if (!animal) return <Navigate to="../animals" replace />
  const farm = flow.farms.find((f) => f.id === animal.farmId)
  return (
    <AnimalDetails
      animal={animal}
      farm={farm}
      onBack={flow.goMyAnimals}
      onToggleTheme={onToggleTheme}
      onLogout={onLogout}
      {...flow.navHandlers}
    />
  )
}

export function FarmerRoutes({ flow, user, fullname, onLogout, onToggleTheme }) {
  return (
    <Routes>
      <Route
        index
        element={
          <FarmerDashboard
            onLogout={onLogout}
            onToggleTheme={onToggleTheme}
            user={user}
            fullname={fullname}
            farms={flow.farms.map((f) => ({ ...f, animalCount: flow.animals.filter((a) => a.farmId === f.id).length }))}
            animalsCount={flow.animals.length}
            setup={flow.farmerSetup}
            onGoProfileSetup={flow.goFarmerProfileSetup}
            onGoFarmSetup={flow.goFarmerFarmSetup}
            onGoAnimalSetup={flow.goFarmerAnimalSetup}
            onGoTraceabilityLookup={flow.goFarmerTraceability}
            onGoHealthRecords={flow.goFarmerHealthRecords}
            onGoMyFarms={flow.goMyFarms}
            onGoMyAnimals={flow.goMyAnimals}
            onGoNotBuilt={flow.goFarmerNotBuilt}
            onGoNotifications={flow.goFarmerNotifications}
            onGoProfile={flow.goFarmerProfile}
            onGoSales={flow.goFarmerSales}
            onGoSettings={flow.goFarmerSettings}
            isLoading={flow.isLoading}
          />
        }
      />
      <Route
        path="notifications"
        element={<FarmerNotifications fullname={fullname} onGoDashboard={flow.goFarmerDashboard} onToggleTheme={onToggleTheme} onLogout={onLogout} {...flow.navHandlers} />}
      />
      <Route
        path="profile"
        element={<FarmerProfile user={user} fullname={fullname} onGoDashboard={flow.goFarmerDashboard} onToggleTheme={onToggleTheme} onLogout={onLogout} {...flow.navHandlers} />}
      />
      <Route path="sales" element={<FarmerSales fullname={fullname} onGoDashboard={flow.goFarmerDashboard} onToggleTheme={onToggleTheme} onLogout={onLogout} {...flow.navHandlers} />} />
      <Route path="settings" element={<FarmerSettings user={user} fullname={fullname} onGoDashboard={flow.goFarmerDashboard} onToggleTheme={onToggleTheme} onLogout={onLogout} {...flow.navHandlers} />} />
      <Route path="traceability" element={<FarmerTraceabilityLookup onGoHome={flow.goFarmerDashboard} onLookup={flow.recordTraceabilityLookup} onSeeHistory={flow.goFarmerTraceabilityHistory} />} />
      <Route path="traceability/history" element={<FarmerTraceabilityHistory onGoHome={flow.goFarmerDashboard} history={flow.traceabilityHistory} onBack={flow.goFarmerTraceability} />} />
      <Route
        path="setup/profile"
        element={
          <FarmerProfileSetup
            onGoFarm={flow.handleFarmerProfileComplete}
            onGoDashboard={flow.goFarmerDashboard}
            onCancel={flow.goFarmerDashboard}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            {...flow.navHandlers}
          />
        }
      />
      <Route
        path="setup/farm"
        element={
          <FarmSetup
            onGoAnimal={flow.handleFarmSubmitAndGoAnimal}
            onGoDashboard={flow.handleFarmSubmitAndGoDashboard}
            onCancel={flow.goFarmerDashboard}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            {...flow.navHandlers}
          />
        }
      />
      <Route
        path="setup/animal"
        element={
          <AnimalSetup
            farms={flow.farms}
            onGoFarm={flow.goFarmerFarmSetup}
            onFinish={flow.handleAnimalSubmit}
            onCancel={flow.goFarmerDashboard}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            {...flow.navHandlers}
          />
        }
      />
      <Route
        path="health-records"
        element={
          <HealthRecordsScreen
            onBack={flow.goFarmerDashboard}
            onGoAnimalSetup={flow.goFarmerAnimalSetup}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            {...flow.navHandlers}
          />
        }
      />
      <Route
        path="farms"
        element={
          <MyFarms
            farms={flow.farms}
            animals={flow.animals}
            onViewFarm={flow.goFarmDetails}
            onManageFarm={flow.goManageFarm}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            {...flow.navHandlers}
          />
        }
      />
      <Route
        path="farms/:farmId"
        element={<FarmDetailsPage flow={flow} onToggleTheme={onToggleTheme} onLogout={onLogout} />}
      />
      <Route
        path="farms/:farmId/manage"
        element={<ManageFarmPage flow={flow} onToggleTheme={onToggleTheme} onLogout={onLogout} />}
      />
      <Route
        path="animals"
        element={
          <MyAnimals
            animals={flow.animals}
            farms={flow.farms}
            onOpenAnimal={flow.goAnimalDetails}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            {...flow.navHandlers}
          />
        }
      />
      <Route
        path="animals/:animalId"
        element={<AnimalDetailsPage flow={flow} onToggleTheme={onToggleTheme} onLogout={onLogout} />}
      />
      <Route
        path="not-built"
        element={
          <Placeholder
            roleName="This feature"
            onBack={flow.goFarmerDashboard}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
            {...flow.navHandlers}
          />
        }
      />
    </Routes>
  )
}
