// FarmSetup.jsx code
import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import {
  SectionTitle, TextInput, SelectInput,
  PillGroup, CheckboxGroup, FieldRow, FileInput, SetupActions,
} from '../components/SetupBits'
import { getFarmerNavItems } from '../data/farmerNav'
import { KENYA_LOCATIONS } from '../data/kenyaLocations'

const KENYA_COUNTIES = Object.keys(KENYA_LOCATIONS)

function MapLocationField({ label, hint, value, onChange }) {
  const [status, setStatus] = useState(value ? 'ready' : 'idle') // idle | locating | ready | error
  const [errorMsg, setErrorMsg] = useState('')

  const handlePin = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMsg('Location services are not available on this device.')
      return
    }
    setStatus('locating')
    setErrorMsg('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onChange({ lat: latitude, lng: longitude })
        setStatus('ready')
      },
      (err) => {
        setStatus('error')
        setErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied. Enable it in your browser/device settings.'
            : 'Could not get your current location. Try again.'
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const mapSrc = value
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${value.lng - 0.01}%2C${value.lat - 0.008}%2C${value.lng + 0.01}%2C${value.lat + 0.008}&layer=mapnik&marker=${value.lat}%2C${value.lng}`
    : null

  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {hint && <p className="field-hint">{hint}</p>}

      <div
        style={{
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border-color, #ddd)',
          background: 'var(--surface-muted, #f4f4f4)',
        }}
      >
        {mapSrc ? (
          <iframe
            title="Farm location map"
            src={mapSrc}
            style={{ width: '100%', height: 220, border: 0, display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--text-muted, #777)',
              padding: '0 16px',
              textAlign: 'center',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span>
              {status === 'locating' ? 'Locating your farm…' : 'No location pinned yet'}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn btn-outline"
        onClick={handlePin}
        disabled={status === 'locating'}
        style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        {status === 'locating'
          ? 'Locating…'
          : value
          ? 'Update to current location'
          : 'Pin my current location'}
      </button>

      {status === 'ready' && value && (
        <p className="field-hint" style={{ marginTop: 6 }}>Location pinned ✓</p>
      )}
      {status === 'error' && (
        <p className="field-hint" style={{ marginTop: 6, color: 'var(--error-color, #c0392b)' }}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}

export function FarmSetup({
  onGoAnimal, onGoDashboard, onToggleTheme, onLogout, ...navHandlers
}) {
  const [farmName, setFarmName] = useState('')
  const [county, setCounty] = useState('')
  const [subCounty, setSubCounty] = useState('')
  const [ward, setWard] = useState('')
  const [ownership, setOwnership] = useState('')
  const [waterSource, setWaterSource] = useState([])
  const [feedSources, setFeedSources] = useState([])
  const [practice, setPractice] = useState('')
  const [gps, setGps] = useState(null)

  const navItems = getFarmerNavItems('', navHandlers)

  const subCountyOptions = county ? Object.keys(KENYA_LOCATIONS[county] || {}) : []
  const wardOptions = county && subCounty ? (KENYA_LOCATIONS[county][subCounty] || []) : []

  const handleCountyChange = (e) => {
    setCounty(e.target.value)
    setSubCounty('')
    setWard('')
  }

  const handleSubCountyChange = (e) => {
    setSubCounty(e.target.value)
    setWard('')
  }

  const buildFarmData = () => ({
    name: farmName.trim() || 'New farm',
    sub: `${county || 'Kenya'} · Newly registered`,
    count: '0 head',
  })

  const handleSubmit = (e, next) => {
    e.preventDefault()
    next(buildFarmData())
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
      <div className="setup-wrap" style={{ justifyContent: 'flex-start', paddingTop: 28 }}>
        <div className="setup-card">
          <p className="setup-title">Farm Setup</p>
          <p className="setup-subtitle">Register the details of the farm this animal data will belong to.</p>

          <div className="setup-progress" aria-label="Farm enrollment progress">
            <span className="setup-progress-step active">1. Farm details</span>
            <span className="setup-progress-step">2. Location</span>
            <span className="setup-progress-step">3. Review</span>
          </div>

          <form>
            <SectionTitle>Basic farm information</SectionTitle>

            <TextInput label="Farm name" placeholder="e.g. Kiambu Highlands Farm" value={farmName} onChange={(e) => setFarmName(e.target.value)} />

            <PillGroup
              label="Farm ownership type"
              options={['Tenant / Leaseholder', 'Owner', 'Cooperative member']}
              value={ownership}
              onChange={setOwnership}
            />

            <FieldRow>
              <TextInput label="Farm size (acres)" type="number" placeholder="e.g. 12" />
            </FieldRow>

             <CheckboxGroup
              label="Water sources used"
              hint="Select all that apply."
              options={['Borehole', 'River / stream', 'Piped / municipal supply', 'Rainwater harvesting', 'Dam / pond']}
              values={waterSource}
              onChange={setWaterSource}
            />

            <CheckboxGroup
              label="Feed sources"
              hint="Select all that apply."
              options={['Pasture', 'Hay', 'Food supplements']}
              values={feedSources}
              onChange={setFeedSources}
            />

            <PillGroup
              label="Farming practices"
              options={['Free-range', 'Zero grazing', 'Semi-intensive', 'Pastoral farming', 'Ranching/Extensive farming', 'Organic farming','Feedlot farming']}
              value={practice}
              onChange={setPractice}
            />

            <FieldRow>
              <TextInput label="Number of farm workers" type="number" placeholder="e.g. 3" />
            </FieldRow>

            <FieldRow>
              <TextInput label="Veterinary service provider — name" placeholder="e.g. Dr. James Mwangi" />
              <TextInput label="Veterinary service provider — number" type="tel" placeholder="+254 7XX XXX XXX" />
            </FieldRow>

            <SectionTitle>Location details</SectionTitle>

            <FieldRow>
              <SelectInput label="County" options={KENYA_COUNTIES} value={county} onChange={handleCountyChange} />
            </FieldRow>
            <FieldRow>
              <SelectInput
                label="Sub-county"
                options={subCountyOptions}
                value={subCounty}
                onChange={handleSubCountyChange}
                disabled={!county}
              />
              <SelectInput
                label="Ward"
                options={wardOptions}
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                disabled={!subCounty}
              />
            </FieldRow>
            <TextInput label="Village / estate" placeholder="e.g. Membley Estate" />

            <MapLocationField
              label="GPS location"
              hint="Pin your farm's current location on the map."
              value={gps}
              onChange={setGps}
            />

            <SectionTitle>Documentation and verification</SectionTitle>

            <FileInput label="Upload farm photos" multiple hint="Minimum 5 photos." />

            <SetupActions>
              <button className="btn btn-outline" onClick={(e) => handleSubmit(e, onGoDashboard)}>
                Return to dashboard
              </button>
              <button className="btn btn-primary" onClick={(e) => handleSubmit(e, onGoAnimal)}>
                Enroll new animal
              </button>
            </SetupActions>
          </form>
        </div>
      </div>
    </DashboardShell>
  )
}
