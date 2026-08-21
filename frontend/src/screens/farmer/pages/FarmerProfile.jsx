import { useState } from 'react'
import { getSupabase } from '../../../lib/supabase'
import { DashboardShell } from '../../../components/DashboardShell'
import { FieldRow, SelectInput, SetupActions, TextInput } from '../components/SetupBits'
import { getFarmerNavItems } from '../data/farmerNav'

const COUNTY_OPTIONS = ['Baringo', 'Bomet', 'Bungoma', 'Kiambu', 'Kisumu', 'Nakuru', 'Nairobi', 'Narok', 'Nyeri', 'Uasin Gishu']

export function FarmerProfile({ user, fullname = 'there', onToggleTheme, onLogout, onGoDashboard, ...navHandlers }) {
  const profile = user?.profile || {}
  const [form, setForm] = useState({
    phone: user?.phone || '',
    farmName: profile.farmName || '',
    county: profile.county || '',
    location: profile.location || '',
  })
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const navItems = getFarmerNavItems('', navHandlers)
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    const { error } = await getSupabase().auth.updateUser({
      phone: form.phone.trim() || undefined,
      data: {
        farm_name: form.farmName.trim(),
        county: form.county,
        location: form.location.trim(),
      },
    })
    setSaving(false)
    setStatus(error ? error.message : 'Profile updated successfully.')
  }

  return (
    <DashboardShell
      roleLabel="FARMER"
      actorId="F-2026-0001"
      name={fullname}
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      profileActive
      onProfileClick={onGoDashboard}
      onNotificationsToggle={navHandlers.onGoNotifications}
    >
      <div className="setup-wrap">
        <div className="setup-card">
          <p className="setup-title">Your profile</p>
          <p className="setup-subtitle">Review your signup details and keep your contact and farm information current.</p>

          <form onSubmit={handleSubmit}>
            <h3 className="form-section-title">Account details</h3>
            <FieldRow>
              <TextInput label="Full name" value={fullname} readOnly hint="Contact support if your legal name needs to change." />
              <TextInput label="Email address" value={user?.email || ''} readOnly />
            </FieldRow>
            <FieldRow>
              <TextInput label="National ID / Passport" value={profile.nationalId} readOnly />
              <TextInput label="Phone number" value={form.phone} onChange={update('phone')} type="tel" />
            </FieldRow>

            <h3 className="form-section-title">Farm details</h3>
            <FieldRow>
              <TextInput label="Farm name" value={form.farmName} onChange={update('farmName')} />
              <SelectInput label="County" options={COUNTY_OPTIONS} value={form.county} onChange={update('county')} />
            </FieldRow>
            <TextInput label="Location / village" value={form.location} onChange={update('location')} placeholder="e.g. Ruiru, Kiambu" />

            {status && <p style={{ color: status.includes('successfully') ? 'var(--green-700, #28734a)' : 'var(--rust-600)', fontSize: 13 }}>{status}</p>}
            <SetupActions>
              <button type="button" className="btn btn-outline" onClick={onGoDashboard}>Back to dashboard</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </SetupActions>
          </form>
        </div>
      </div>
    </DashboardShell>
  )
}
