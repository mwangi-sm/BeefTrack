import { DashboardShell } from '../../../components/DashboardShell'
import { TextInput, SelectInput, FieldRow, FileInput, SetupActions } from '../components/SetupBits'
import { getFarmerNavItems } from '../data/farmerNav'

export function FarmerProfileSetup({
  onGoFarm, onGoDashboard, onToggleTheme, onLogout, ...navHandlers
}) {
  const navItems = getFarmerNavItems('', navHandlers)

  const handleSubmit = (e, next) => {
    e.preventDefault()
    next()
  }

  return (
    <DashboardShell
      roleLabel="FARMER"
      actorId="F-2026-0001"
      name="Wanjiku Mwangi"
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      variant="secondary"
      onGoHome={onGoDashboard}
    >
      <div className="setup-wrap">
        <div className="setup-card">
          <p className="setup-title">Farmer Profile Setup</p>
          <p className="setup-subtitle">Tell us a bit about yourself</p>

          <form>
            <FieldRow>
              <SelectInput label="Gender" options={['Female', 'Male', 'Prefer not to say']} />
              <TextInput label="Date of birth" type="date" />
            </FieldRow>

            <FieldRow>
              <TextInput label="National ID number" placeholder="e.g. 34567890" />
              <TextInput label="Farmer registration number (if available)" placeholder="e.g. FR-2026-00145" />
            </FieldRow>

            <FileInput label="Upload photo of ID" />
            <FileInput label="Upload photo of farmer ID (if available)" />
            <FileInput label="Upload farmer photo(s)" multiple hint="A clear photo of yourself for verification purposes." />

            <SetupActions>
              <button className="btn btn-outline" onClick={(e) => handleSubmit(e, onGoDashboard)}>
                Return to dashboard
              </button>
              <button className="btn btn-primary" onClick={(e) => handleSubmit(e, onGoFarm)}>
                Enroll new farm
              </button>
            </SetupActions>
          </form>
        </div>
      </div>
    </DashboardShell>
  )
}
