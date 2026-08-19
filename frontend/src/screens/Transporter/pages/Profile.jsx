import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { Panel, DetailRow, LoadingState, ErrorState } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useAsync } from '../services/useTransporter'
import { getProfile, updateProfile } from '../services/transporterApi'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5MB
const AVATAR_SIZE = 72

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
  return initials || '?'
}

function OverlayIconButton({ corner, size = 26, background, onClick, disabled, label, children }) {
  const edge = corner === 'top-right' ? { top: -2, right: -2 } : { bottom: -2, right: -2 }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        position: 'absolute',
        ...edge,
        width: size,
        height: size,
        borderRadius: '50%',
        background,
        border: '2px solid var(--cream-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}

const circleBase = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  borderRadius: '50%',
}

// All fields that can be edited — grouped for display but all editable in one go.
const personalFields = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
]

const transportFields = [
  { key: 'transporterType', label: 'Transporter Type' },
  { key: 'companyName', label: 'Company Name', showIf: (f) => f.transporterType === 'Company' },
  { key: 'vehicleRegistration', label: 'Vehicle Registration' },
  { key: 'licenseNumber', label: 'Driver License Number', required: true },
]

const additionalFields = [
  { key: 'nationalId', label: 'National ID' },
  { key: 'businessRegNumber', label: 'Business Registration No.', showIf: (f) => f.transporterType === 'Company' },
  { key: 'vehicleMake', label: 'Vehicle Make' },
  { key: 'vehicleModel', label: 'Vehicle Model' },
  { key: 'vehicleCapacity', label: 'Vehicle Capacity' },
  { key: 'county', label: 'County' },
  { key: 'address', label: 'Address' },
  { key: 'emergencyContact', label: 'Emergency Contact' },
]

function visibleFields(list, form) {
  return list.filter((f) => !f.showIf || f.showIf(form))
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1.5px solid var(--border-soft)',
  background: 'var(--page-bg)',
  color: 'var(--ink-900)',
  fontFamily: 'inherit',
  fontSize: 13.5,
}

function FieldRow({ label, value, editing, onChange, placeholder, required }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ fontSize: 12.5, color: 'var(--ink-600)', whiteSpace: 'nowrap', paddingTop: editing ? 11 : 0, minWidth: 120 }}>
        {label}
        {required && <span style={{ color: 'var(--rust-600)', marginLeft: 3 }}>*</span>}
      </span>
      {editing ? (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          style={{ ...inputStyle, textAlign: 'right' }}
        />
      ) : (
        <span style={{ fontSize: 13.5, color: 'var(--ink-900)', fontWeight: 500, textAlign: 'right' }}>
          {value || <span style={{ color: 'var(--ink-600)', opacity: 0.5 }}>—</span>}
        </span>
      )}
    </div>
  )
}

const INITIAL_FORM = {
  fullName: '',
  email: '',
  phone: '',
  transporterType: '',
  companyName: '',
  vehicleRegistration: '',
  licenseNumber: '',
  nationalId: '',
  businessRegNumber: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleCapacity: '',
  county: '',
  address: '',
  emergencyContact: '',
  documentsStatus: '',
  photo: null,
}

export function Profile({ user }) {
  const navigate = useNavigate()
  const { data: profile, loading, error, reload } = useAsync(getProfile, [])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState(null)
  const fileInputRef = useRef(null)

  // Sync from server on load
  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({
        ...prev,
        ...profile,
        // Session identity takes precedence over the mock profile fixture.
        fullName: user?.fullname || profile.fullName,
        email: user?.email || profile.email,
        phone: user?.phone || profile.phone,
        transporterType: user?.accountType || profile.transporterType,
      }))
    }
  }, [profile, user])

  const isComplete = form.licenseNumber?.trim()

  function handleFieldChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(form)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      reload()
    } catch {
      alert("Couldn't save profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (profile) {
      setForm((prev) => ({ ...prev, ...profile }))
    }
    setEditing(false)
  }

  async function savePhoto(photo) {
    setPhotoError(null)
    setUploadingPhoto(true)
    try {
      const updated = { ...form, photo }
      await updateProfile(updated)
      setForm(updated)
    } catch {
      setPhotoError(photo ? "Couldn't update your photo. Try again." : "Couldn't remove your photo. Try again.")
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('Image must be under 5MB.')
      e.target.value = ''
      return
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Read failed'))
      reader.readAsDataURL(file)
    })
    await savePhoto(dataUrl)
    e.target.value = ''
  }

  function handleRemovePhoto() {
    if (window.confirm('Remove your profile picture?')) savePhoto(null)
  }

  return (
    <>
      <DashHead
        title="Profile"
        subtitle="Your driver details as they appear to other roles in BeefTrace."
        actions={
          !loading && !error && !editing && (
            <button className="btn btn-outline" onClick={() => setEditing(true)}>
              <Icon size={14}>{IconPaths.edit}</Icon>
              {isComplete ? 'Edit profile' : 'Complete profile'}
            </button>
          )
        }
      />

      {loading && <Panel><LoadingState label="Loading profile…" /></Panel>}
      {!loading && error && <Panel><ErrorState message="Couldn't load your profile." onRetry={reload} /></Panel>}

      {!loading && !error && (
        <form onSubmit={handleSave}>
          {/* ----- Personal information ----- */}
          <Panel title="Personal information">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <div style={{ position: 'relative', ...circleBase, flexShrink: 0 }}>
                {form.photo ? (
                  <img
                    src={form.photo}
                    alt="Profile"
                    style={{ ...circleBase, objectFit: 'cover', border: '1px solid var(--border-soft)' }}
                  />
                ) : (
                  <div
                    style={{
                      ...circleBase,
                      background: 'var(--gold-600)',
                      color: 'var(--cream-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Fraunces, serif',
                      fontSize: 24,
                      fontWeight: 600,
                    }}
                  >
                    {getInitials(form.fullName)}
                  </div>
                )}

                <OverlayIconButton
                  corner="bottom-right"
                  background="var(--maroon-800)"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  label={form.photo ? 'Change profile picture' : 'Add profile picture'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cream-100)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </OverlayIconButton>

                {form.photo && (
                  <OverlayIconButton
                    corner="top-right"
                    size={22}
                    background="var(--rust-600)"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    label="Remove profile picture"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--cream-100)" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </OverlayIconButton>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--ink-900)', fontWeight: 600 }}>
                  {form.fullName || 'Unnamed driver'}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: photoError ? 'var(--rust-600)' : 'var(--ink-900)', opacity: photoError ? 1 : 0.6 }}>
                  {photoError ?? (uploadingPhoto ? 'Uploading…' : 'JPG or PNG, up to 5MB')}
                </p>
              </div>
            </div>

            {personalFields.map((f) => (
              <FieldRow
                key={f.key}
                label={f.label}
                value={form[f.key]}
                editing={editing}
                onChange={(v) => handleFieldChange(f.key, v)}
              />
            ))}
          </Panel>

          {/* ----- Transport details ----- */}
          <Panel title="Transport details">
            {editing && !isComplete && (
              <p style={{ fontSize: 13, color: 'var(--rust-600)', margin: '0 0 14px' }}>
                Add your driver license number to complete your profile.
              </p>
            )}
            {visibleFields(transportFields, form).map((f) => (
              <FieldRow
                key={f.key}
                label={f.label}
                value={form[f.key]}
                editing={editing}
                onChange={(v) => handleFieldChange(f.key, v)}
                required={f.required}
              />
            ))}
          </Panel>

          {/* ----- Additional information ----- */}
          <Panel title="Additional information">
            <p style={{ fontSize: 12, color: 'var(--ink-900)', opacity: 0.6, margin: '0 0 14px' }}>
              Optional — add these whenever you're ready.
            </p>
            {visibleFields(additionalFields, form).map((f) => (
              <FieldRow
                key={f.key}
                label={f.label}
                value={form[f.key]}
                editing={editing}
                onChange={(v) => handleFieldChange(f.key, v)}
              />
            ))}
          </Panel>

          {/* ----- Documents ----- */}
          <Panel title="Documents">
            <DetailRow label="Status" value={form.documentsStatus || 'Not submitted'} />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/dashboard/transporter/documents')}
              style={{ marginTop: 8 }}
            >
              Manage documents
            </button>
          </Panel>

          {/* ----- Save / Cancel ----- */}
          {editing && (
            <Panel>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
              {saved && (
                <p style={{ fontSize: 12.5, color: 'var(--gold-600)', margin: '10px 0 0', textAlign: 'center', fontWeight: 600 }}>
                  Profile updated
                </p>
              )}
            </Panel>
          )}
        </form>
      )}
    </>
  )
}
