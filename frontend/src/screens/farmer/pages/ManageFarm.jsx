//ManageFarm.jsx code
import { useState } from 'react'
import { DashboardShell } from '../../../components/DashboardShell'
import {
  SectionTitle, TextInput, SelectInput, PillGroup, CheckboxGroup, FieldRow, GpsField,
} from '../components/SetupBits'
import { Icon, IconPaths } from '../../../components/icons'
import { getFarmerNavItems } from '../data/farmerNav'

const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu',
  'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru',
  'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
]

export function ManageFarm({ farm, onGoHome, onGoFarmSetup, onGoAnimalSetup, onGoMyFarms, onGoMyAnimals, onGoHealthRecords, onSave, onCancel, onToggleTheme, onLogout }) {
  const navItems = getFarmerNavItems('myfarms', {
    onGoHome,
    onGoFarmSetup,
    onGoAnimalSetup,
    onGoMyFarms,
    onGoMyAnimals,
    onGoHealthRecords,
  })

  const [values, setValues] = useState({
    name: farm.name || '',
    county: farm.county || '',
    ownership: farm.ownership || '',
    size: farm.size || '',
    waterSource: farm.waterSource || '',
    feedSources: farm.feedSources || [],
    practice: farm.practice || '',
    workers: farm.workers || '',
    vetName: farm.vetName || '',
    vetNumber: farm.vetNumber || '',
    subCounty: farm.subCounty || '',
    ward: farm.ward || '',
    village: farm.village || '',
    gps: farm.gps || '',
  })

  const update = (field, value) => setValues((prev) => ({ ...prev, [field]: value }))

  const handleSave = (e) => {
    e.preventDefault()
    onSave({ ...farm, ...values })
  }

  return (
    <DashboardShell
      roleLabel="FARMER"
      actorId="F-2026-0001"
      name="Wanjiku Mwangi"
      navItems={navItems}
      variant="secondary"
      onGoHome={onGoHome}
      onToggleTheme={onToggleTheme}
      onLogout={onLogout}
    >
      <div className="dash-head">
        <div>
          <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>Manage farm</p>
          <h1>{farm.name}</h1>
          <p className="sub mono">{farm.id}</p>
        </div>
        <div className="quick-actions">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <SectionTitle>Basic farm information</SectionTitle>
        <TextInput label="Farm name" value={values.name} onChange={(e) => update('name', e.target.value)} />
        <PillGroup
          label="Farm ownership type"
          options={['Tenant / Leaseholder', 'Owner', 'Cooperative member']}
          value={values.ownership}
          onChange={(v) => update('ownership', v)}
        />
        <FieldRow>
          <TextInput label="Farm size (acres)" type="number" value={values.size} onChange={(e) => update('size', e.target.value)} />
          <SelectInput
            label="Water source used"
            options={['Borehole', 'River / stream', 'Piped / municipal supply', 'Rainwater harvesting', 'Dam / pond', 'Other']}
            value={values.waterSource}
            onChange={(e) => update('waterSource', e.target.value)}
          />
        </FieldRow>
        <CheckboxGroup
          label="Feed sources"
          hint="Select all that apply."
          options={['Pasture', 'Hay', 'Food supplements']}
          values={values.feedSources}
          onChange={(v) => update('feedSources', v)}
        />
        <PillGroup
          label="Farming practices"
          options={['Free-range', 'Zero grazing', 'Semi-intensive']}
          value={values.practice}
          onChange={(v) => update('practice', v)}
        />
        <TextInput label="Number of farm workers" type="number" value={values.workers} onChange={(e) => update('workers', e.target.value)} />
        <FieldRow>
          <TextInput label="Veterinary service provider — name" value={values.vetName} onChange={(e) => update('vetName', e.target.value)} />
          <TextInput label="Veterinary service provider — number" type="tel" value={values.vetNumber} onChange={(e) => update('vetNumber', e.target.value)} />
        </FieldRow>

        <SectionTitle>Location details</SectionTitle>
        <FieldRow>
          <TextInput label="Country" defaultValue="Kenya" />
          <SelectInput label="County" options={KENYA_COUNTIES} value={values.county} onChange={(e) => update('county', e.target.value)} />
        </FieldRow>
        <FieldRow>
          <TextInput label="Sub-county" value={values.subCounty} onChange={(e) => update('subCounty', e.target.value)} />
          <TextInput label="Ward" value={values.ward} onChange={(e) => update('ward', e.target.value)} />
        </FieldRow>
        <TextInput label="Village / estate" value={values.village} onChange={(e) => update('village', e.target.value)} />
        <GpsField label="GPS location" value={values.gps} onChange={(v) => update('gps', v)} />

        <div className="setup-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>Discard changes</button>
          <button type="submit" className="btn btn-primary">
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.check}</Icon>Save changes
          </button>
        </div>
      </form>
    </DashboardShell>
  )
}
