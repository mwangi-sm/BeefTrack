import { useState } from 'react'
import { Icon, IconPaths } from '../../../components/icons'
import { FieldError, CountySelect, PasswordField } from '../../../signup_screens/SignupKit'
import { PHONE_RE, EMAIL_RE } from '../../../signup_screens/signupConstants'

const TOTAL_STEPS = 8

// eslint-disable-next-line react-refresh/only-export-components
export const STEP_LABELS = [
  'Company',
  'Warehouse',
  'Contact',
  'Configuration',
  'Delivery',
  'Documents',
  'Security',
  'Review',
]

const INDUSTRY_OPTIONS = [
  'Meat Distribution',
  'Meat Processing',
  'Cold Chain Logistics',
  'Food & Beverage Distribution',
  'General Distribution',
]

const WAREHOUSE_TYPES = ['Cold Storage', 'Frozen Storage', 'Dry Storage']

const JOB_TITLES = [
  'Warehouse Manager',
  'Operations Manager',
  'Logistics Coordinator',
  'Distributor Owner',
  'Other',
]

const SECURITY_QUESTIONS = [
  "What was your first pet's name?",
  "What is your mother's maiden name?",
  'What city were you born in?',
  'What was the name of your first school?',
]

const DELIVERY_TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening']

function emptyForm() {
  return {
    company: {
      logoName: '',
      distributorName: '',
      businessRegNumber: '',
      kraPin: '',
      licenseNumber: '',
      yearsInOperation: '',
      description: '',
      industry: INDUSTRY_OPTIONS[0],
      website: '',
      email: '',
      phone: '',
      altPhone: '',
    },
    warehouse: {
      name: '',
      type: WAREHOUSE_TYPES[0],
      capacityTons: '',
      currentCapacityPercent: '',
      address: '',
      county: '',
      subCounty: '',
      town: '',
      postalAddress: '',
      latitude: '',
      longitude: '',
      storageBays: [],
    },
    contact: {
      fullName: '',
      jobTitle: JOB_TITLES[0],
      email: '',
      phone: '',
      nationalId: '',
      employeeNumber: '',
    },
    configuration: {
      temperatureMonitoring: true,
      minTemp: '-18',
      maxTemp: '-10',
      barcodeScanner: true,
      qrCodeScanner: true,
      batchTracking: true,
      fifo: true,
      fefo: true,
      notifyLowStock: true,
      notifyExpiring: true,
      notifyDispatch: true,
      notifyCapacity: true,
    },
    delivery: {
      radiusKm: '',
      vehiclesManaged: '',
      avgDailyDispatches: '',
      preferredTimes: [],
    },
    documents: {
      businessRegistration: '',
      businessPermit: '',
      kraCertificate: '',
      foodHandlingCertificate: '',
      warehouseLicense: '',
      insuranceCertificate: '',
    },
    security: {
      password: '',
      confirmPassword: '',
      twoFactorEnabled: true,
      securityQuestion: '',
      securityAnswer: '',
    },
  }
}

function validateCompany(company) {
  const e = {}
  if (!company.distributorName.trim()) e.distributorName = 'Distributor name is required.'
  if (!company.email.trim()) e.email = 'Email is required.'
  else if (!EMAIL_RE.test(company.email.trim())) e.email = 'Enter a valid email address.'
  if (!company.phone.trim()) e.phone = 'Phone number is required.'
  else if (!PHONE_RE.test(company.phone.trim())) e.phone = 'Enter a valid Kenyan phone number.'
  return e
}

function validateWarehouse(warehouse) {
  const e = {}
  if (!warehouse.name.trim()) e.name = 'Warehouse name is required.'
  if (!warehouse.address.trim()) e.address = 'Warehouse address is required.'
  if (!warehouse.county) e.county = 'Select a county.'
  return e
}

function validateContact(contact) {
  const e = {}
  if (!contact.fullName.trim()) e.fullName = 'Full name is required.'
  if (!contact.email.trim()) e.email = 'Email is required.'
  else if (!EMAIL_RE.test(contact.email.trim())) e.email = 'Enter a valid email address.'
  if (!contact.phone.trim()) e.phone = 'Phone number is required.'
  else if (!PHONE_RE.test(contact.phone.trim())) e.phone = 'Enter a valid Kenyan phone number.'
  return e
}

function validateSecurity(security, isEditing) {
  const e = {}
  // Editing an existing profile with both password fields left blank means "leave
  // password unchanged" — only validate if they've actually started typing one.
  const touchingPassword = !isEditing || security.password || security.confirmPassword
  if (touchingPassword) {
    if (!security.password) e.password = 'Password is required.'
    else if (security.password.length < 8) e.password = 'At least 8 characters.'
    if (!security.confirmPassword) e.confirmPassword = 'Confirm your password.'
    else if (security.confirmPassword !== security.password) e.confirmPassword = 'Passwords do not match.'
  }
  return e
}

function validateStep(step, form, isEditing) {
  switch (step) {
    case 1: return { company: validateCompany(form.company) }
    case 2: return { warehouse: validateWarehouse(form.warehouse) }
    case 3: return { contact: validateContact(form.contact) }
    case 7: return { security: validateSecurity(form.security, isEditing) }
    default: return {}
  }
}

function stepHasErrors(stepErrors) {
  return Object.values(stepErrors).some((section) => Object.keys(section).length > 0)
}

export function ProfileSetupWizard({ onClose = () => {}, onComplete = () => {}, initialData = null, initialStep = 1 }) {
  const isEditing = !!initialData
  const [step, setStep] = useState(initialStep)
  const [form, setForm] = useState(() => (initialData ? { ...emptyForm(), ...initialData } : emptyForm()))
  const [errors, setErrors] = useState({})
  const [warehouseCode] = useState(() => initialData?.warehouse?.code || `WH-${Date.now().toString().slice(-6)}`)

  const set = (section, field) => (e) => {
    const value = e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setForm((f) => ({ ...f, [section]: { ...f[section], [field]: value } }))
  }

  const handleFile = (section, field) => (e) => {
    const name = e.target.files?.[0]?.name || ''
    setForm((f) => ({ ...f, [section]: { ...f[section], [field]: name } }))
  }

  const addStorageBay = () => {
    setForm((f) => ({
      ...f,
      warehouse: {
        ...f.warehouse,
        storageBays: [...f.warehouse.storageBays, `Bay ${f.warehouse.storageBays.length + 1}`],
      },
    }))
  }

  const updateStorageBay = (index, value) => {
    setForm((f) => {
      const next = [...f.warehouse.storageBays]
      next[index] = value
      return { ...f, warehouse: { ...f.warehouse, storageBays: next } }
    })
  }

  const removeStorageBay = (index) => {
    setForm((f) => ({
      ...f,
      warehouse: { ...f.warehouse, storageBays: f.warehouse.storageBays.filter((_, i) => i !== index) },
    }))
  }

  const togglePreferredTime = (time) => {
    setForm((f) => {
      const has = f.delivery.preferredTimes.includes(time)
      return {
        ...f,
        delivery: {
          ...f.delivery,
          preferredTimes: has
            ? f.delivery.preferredTimes.filter((t) => t !== time)
            : [...f.delivery.preferredTimes, time],
        },
      }
    })
  }

  const handlePinLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          warehouse: {
            ...f.warehouse,
            latitude: String(pos.coords.latitude.toFixed(6)),
            longitude: String(pos.coords.longitude.toFixed(6)),
          },
        }))
      },
      () => {
        // Silently ignore — the fields just stay blank/editable by hand if location
        // access is denied or unavailable.
      }
    )
  }

  const handleNext = () => {
    const stepErrors = validateStep(step, form, isEditing)
    setErrors((prev) => ({ ...prev, ...stepErrors }))
    if (stepHasErrors(stepErrors)) return
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleSubmit = () => {
    const securityErrors = validateStep(7, form, isEditing)
    if (stepHasErrors(securityErrors)) {
      setErrors((prev) => ({ ...prev, ...securityErrors }))
      setStep(7)
      return
    }
    onComplete({ ...form, warehouse: { ...form.warehouse, code: warehouseCode } })
  }

  return (
    <div className="psw-backdrop" onClick={onClose}>
      <div className="psw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="psw-header">
          <div>
            <h2>{isEditing ? 'Edit your distributor profile' : 'Set up your distributor profile'}</h2>
            <p className="psw-subtitle">Step {step} of {TOTAL_STEPS} · {STEP_LABELS[step - 1]}</p>
          </div>
          <button className="psw-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="psw-steps">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const state = n === step ? 'active' : n < step ? 'done' : 'upcoming'
            return (
              <div key={label} className={`psw-step-dot psw-step-${state}`}>
                <span className="psw-step-circle">{n < step ? '✓' : n}</span>
              </div>
            )
          })}
        </div>

        <div className="psw-body">
          {step === 1 && (
            <div className="psw-section">
              <h3>Company Information</h3>

              <div className="field">
                <label>Company logo</label>
                <label className="btn btn-outline psw-upload-btn">
                  <Icon size={15} style={{ marginRight: 6 }}>{IconPaths.plus}</Icon>
                  {form.company.logoName || 'Upload logo'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile('company', 'logoName')} />
                </label>
              </div>

              <div className="field">
                <label>Distributor name</label>
                <input value={form.company.distributorName} onChange={set('company', 'distributorName')} placeholder="e.g. Highlands Cold Chain Distribution" />
                {errors.company?.distributorName && <FieldError>{errors.company.distributorName}</FieldError>}
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Business registration number</label>
                  <input value={form.company.businessRegNumber} onChange={set('company', 'businessRegNumber')} placeholder="e.g. BN-2024-00123" />
                </div>
                <div className="field">
                  <label>KRA PIN</label>
                  <input value={form.company.kraPin} onChange={set('company', 'kraPin')} placeholder="e.g. P051234567X" />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>License number</label>
                  <input value={form.company.licenseNumber} onChange={set('company', 'licenseNumber')} />
                </div>
                <div className="field">
                  <label>Years in operation</label>
                  <input type="number" min="0" value={form.company.yearsInOperation} onChange={set('company', 'yearsInOperation')} />
                </div>
              </div>

              <div className="field">
                <label>Company description</label>
                <textarea rows={3} value={form.company.description} onChange={set('company', 'description')} placeholder="What your company does, coverage area, specialties…" />
              </div>

              <div className="field">
                <label>Industry</label>
                <select value={form.company.industry} onChange={set('company', 'industry')}>
                  {INDUSTRY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Website</label>
                <input value={form.company.website} onChange={set('company', 'website')} placeholder="https://…" />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Email address</label>
                  <input type="email" value={form.company.email} onChange={set('company', 'email')} placeholder="name@company.co.ke" />
                  {errors.company?.email && <FieldError>{errors.company.email}</FieldError>}
                </div>
                <div className="field">
                  <label>Phone number</label>
                  <input type="tel" value={form.company.phone} onChange={set('company', 'phone')} placeholder="07XX XXX XXX" />
                  {errors.company?.phone && <FieldError>{errors.company.phone}</FieldError>}
                </div>
              </div>

              <div className="field">
                <label>Alternative phone <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <input type="tel" value={form.company.altPhone} onChange={set('company', 'altPhone')} placeholder="07XX XXX XXX" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="psw-section">
              <h3>Warehouse Information</h3>

              <div className="field">
                <label>Warehouse name</label>
                <input value={form.warehouse.name} onChange={set('warehouse', 'name')} placeholder="e.g. Ruiru Cold Store" />
                {errors.warehouse?.name && <FieldError>{errors.warehouse.name}</FieldError>}
              </div>

              <div className="field">
                <label>Warehouse code</label>
                <input value={warehouseCode} disabled />
              </div>

              <div className="field">
                <label>Warehouse type</label>
                <select value={form.warehouse.type} onChange={set('warehouse', 'type')}>
                  {WAREHOUSE_TYPES.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Warehouse capacity (tons)</label>
                  <input type="number" min="0" value={form.warehouse.capacityTons} onChange={set('warehouse', 'capacityTons')} />
                </div>
                <div className="field">
                  <label>Current storage capacity (%)</label>
                  <input type="number" min="0" max="100" value={form.warehouse.currentCapacityPercent} onChange={set('warehouse', 'currentCapacityPercent')} />
                </div>
              </div>

              <div className="field">
                <label>Warehouse address</label>
                <input value={form.warehouse.address} onChange={set('warehouse', 'address')} placeholder="Street, town or plot number" />
                {errors.warehouse?.address && <FieldError>{errors.warehouse.address}</FieldError>}
              </div>

              <div className="field-row">
                <div className="field">
                  <label>County</label>
                  <CountySelect value={form.warehouse.county} onChange={set('warehouse', 'county')} hasError={!!errors.warehouse?.county} />
                  {errors.warehouse?.county && <FieldError>{errors.warehouse.county}</FieldError>}
                </div>
                <div className="field">
                  <label>Sub county</label>
                  <input value={form.warehouse.subCounty} onChange={set('warehouse', 'subCounty')} placeholder="e.g. Ruiru" />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Town</label>
                  <input value={form.warehouse.town} onChange={set('warehouse', 'town')} />
                </div>
                <div className="field">
                  <label>Postal address</label>
                  <input value={form.warehouse.postalAddress} onChange={set('warehouse', 'postalAddress')} placeholder="e.g. P.O. Box 123-00100" />
                </div>
              </div>

              <div className="field">
                <label>Google Maps location</label>
                <button type="button" className="btn btn-outline" onClick={handlePinLocation}>
                  <Icon size={15} style={{ marginRight: 6 }}>{IconPaths.warehouse}</Icon>Pin location
                </button>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Latitude</label>
                  <input value={form.warehouse.latitude} onChange={set('warehouse', 'latitude')} placeholder="e.g. -1.1508" />
                </div>
                <div className="field">
                  <label>Longitude</label>
                  <input value={form.warehouse.longitude} onChange={set('warehouse', 'longitude')} placeholder="e.g. 36.9640" />
                </div>
              </div>

              <div className="field">
                <label>Storage bays</label>
                {form.warehouse.storageBays.length === 0 && (
                  <p className="psw-hint">No storage bays added yet — Warehouse Inventory will use default bay names until you add at least one.</p>
                )}
                {form.warehouse.storageBays.map((bay, i) => (
                  <div key={i} className="psw-bay-row">
                    <input value={bay} onChange={(e) => updateStorageBay(i, e.target.value)} placeholder={`e.g. Bay ${i + 1}`} />
                    <button type="button" className="psw-bay-remove" onClick={() => removeStorageBay(i)} aria-label="Remove bay">✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline psw-add-bay" onClick={addStorageBay}>
                  <Icon size={15} style={{ marginRight: 6 }}>{IconPaths.plus}</Icon>Add storage bay
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="psw-section">
              <h3>Primary Contact</h3>

              <div className="field">
                <label>Full name</label>
                <input value={form.contact.fullName} onChange={set('contact', 'fullName')} />
                {errors.contact?.fullName && <FieldError>{errors.contact.fullName}</FieldError>}
              </div>

              <div className="field">
                <label>Job title</label>
                <select value={form.contact.jobTitle} onChange={set('contact', 'jobTitle')}>
                  {JOB_TITLES.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={form.contact.email} onChange={set('contact', 'email')} />
                  {errors.contact?.email && <FieldError>{errors.contact.email}</FieldError>}
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input type="tel" value={form.contact.phone} onChange={set('contact', 'phone')} placeholder="07XX XXX XXX" />
                  {errors.contact?.phone && <FieldError>{errors.contact.phone}</FieldError>}
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>National ID</label>
                  <input value={form.contact.nationalId} onChange={set('contact', 'nationalId')} />
                </div>
                <div className="field">
                  <label>Employee number <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input value={form.contact.employeeNumber} onChange={set('contact', 'employeeNumber')} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="psw-section">
              <h3>Warehouse Configuration</h3>

              <label className="psw-check">
                <input type="checkbox" checked={form.configuration.temperatureMonitoring} onChange={set('configuration', 'temperatureMonitoring')} />
                Temperature monitoring enabled
              </label>

              <div className="field-row">
                <div className="field">
                  <label>Minimum temperature (°C)</label>
                  <input value={form.configuration.minTemp} onChange={set('configuration', 'minTemp')} disabled={!form.configuration.temperatureMonitoring} />
                </div>
                <div className="field">
                  <label>Maximum temperature (°C)</label>
                  <input value={form.configuration.maxTemp} onChange={set('configuration', 'maxTemp')} disabled={!form.configuration.temperatureMonitoring} />
                </div>
              </div>

              <label className="psw-check">
                <input type="checkbox" checked={form.configuration.barcodeScanner} onChange={set('configuration', 'barcodeScanner')} />
                Barcode scanner enabled
              </label>
              <label className="psw-check">
                <input type="checkbox" checked={form.configuration.qrCodeScanner} onChange={set('configuration', 'qrCodeScanner')} />
                QR code scanner enabled
              </label>

              <p className="psw-group-label">Inventory tracking</p>
              <label className="psw-check">
                <input type="checkbox" checked={form.configuration.batchTracking} onChange={set('configuration', 'batchTracking')} />
                Batch tracking
              </label>
              <label className="psw-check">
                <input type="checkbox" checked={form.configuration.fifo} onChange={set('configuration', 'fifo')} />
                FIFO (first in, first out)
              </label>
              <label className="psw-check">
                <input type="checkbox" checked={form.configuration.fefo} onChange={set('configuration', 'fefo')} />
                FEFO (first expired, first out)
              </label>

              <p className="psw-group-label">Notification preferences</p>
              <label className="psw-check">
                <input type="checkbox" checked={form.configuration.notifyLowStock} onChange={set('configuration', 'notifyLowStock')} />
                Low stock
              </label>
              <label className="psw-check">
                <input type="checkbox" checked={form.configuration.notifyExpiring} onChange={set('configuration', 'notifyExpiring')} />
                Expiring products
              </label>
              <label className="psw-check">
                <input type="checkbox" checked={form.configuration.notifyDispatch} onChange={set('configuration', 'notifyDispatch')} />
                Dispatch alerts
              </label>
              <label className="psw-check">
                <input type="checkbox" checked={form.configuration.notifyCapacity} onChange={set('configuration', 'notifyCapacity')} />
                Capacity alerts
              </label>
            </div>
          )}

          {step === 5 && (
            <div className="psw-section">
              <h3>Delivery Information</h3>

              <div className="field-row">
                <div className="field">
                  <label>Delivery radius (km)</label>
                  <input type="number" min="0" value={form.delivery.radiusKm} onChange={set('delivery', 'radiusKm')} />
                </div>
                <div className="field">
                  <label>Vehicles managed</label>
                  <input type="number" min="0" value={form.delivery.vehiclesManaged} onChange={set('delivery', 'vehiclesManaged')} />
                </div>
              </div>

              <div className="field">
                <label>Average daily dispatches</label>
                <input type="number" min="0" value={form.delivery.avgDailyDispatches} onChange={set('delivery', 'avgDailyDispatches')} />
              </div>

              <div className="field">
                <label>Preferred delivery time</label>
                {DELIVERY_TIME_OPTIONS.map((time) => (
                  <label key={time} className="psw-check">
                    <input
                      type="checkbox"
                      checked={form.delivery.preferredTimes.includes(time)}
                      onChange={() => togglePreferredTime(time)}
                    />
                    {time}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="psw-section">
              <h3>Verification Documents</h3>
              <p className="psw-hint">Optional for now — you can add these later from Settings.</p>

              {[
                ['businessRegistration', 'Business registration'],
                ['businessPermit', 'Business permit'],
                ['kraCertificate', 'KRA certificate'],
                ['foodHandlingCertificate', 'Food handling certificate'],
                ['warehouseLicense', 'Warehouse license'],
                ['insuranceCertificate', 'Insurance certificate'],
              ].map(([field, label]) => (
                <div className="field" key={field}>
                  <label>{label}</label>
                  <label className="btn btn-outline psw-upload-btn">
                    <Icon size={15} style={{ marginRight: 6 }}>{IconPaths.plus}</Icon>
                    {form.documents[field] || 'Upload'}
                    <input type="file" style={{ display: 'none' }} onChange={handleFile('documents', field)} />
                  </label>
                </div>
              ))}
            </div>
          )}

          {step === 7 && (
            <div className="psw-section">
              <h3>Security</h3>
              {isEditing && <p className="psw-hint">Leave both password fields blank to keep your current password.</p>}

              <div className="field-row">
                <div className="field">
                  <label>Create password</label>
                  <PasswordField value={form.security.password} onChange={set('security', 'password')} hasError={!!errors.security?.password} />
                  {errors.security?.password && <FieldError>{errors.security.password}</FieldError>}
                </div>
                <div className="field">
                  <label>Confirm password</label>
                  <PasswordField value={form.security.confirmPassword} onChange={set('security', 'confirmPassword')} hasError={!!errors.security?.confirmPassword} />
                  {errors.security?.confirmPassword && <FieldError>{errors.security.confirmPassword}</FieldError>}
                </div>
              </div>

              <label className="psw-check">
                <input type="checkbox" checked={form.security.twoFactorEnabled} onChange={set('security', 'twoFactorEnabled')} />
                Enable two-factor authentication
              </label>

              <div className="field">
                <label>Security question</label>
                <select value={form.security.securityQuestion} onChange={set('security', 'securityQuestion')}>
                  <option value="">Select question</option>
                  {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Answer</label>
                <input value={form.security.securityAnswer} onChange={set('security', 'securityAnswer')} />
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="psw-section">
              <h3>Review</h3>
              <ul className="psw-review-list">
                <li>✓ Company information — <b>{form.company.distributorName || 'Untitled company'}</b></li>
                <li>✓ Warehouse details — <b>{form.warehouse.name || 'Unnamed warehouse'}</b> ({warehouseCode}), {form.warehouse.storageBays.length} storage bay{form.warehouse.storageBays.length === 1 ? '' : 's'}</li>
                <li>✓ Contact person — <b>{form.contact.fullName || 'Not set'}</b></li>
                <li>✓ Documents — {Object.values(form.documents).filter(Boolean).length} of 6 uploaded</li>
                <li>✓ Security — {form.security.password ? 'Password set' : 'Password not set'}, 2FA {form.security.twoFactorEnabled ? 'enabled' : 'disabled'}</li>
              </ul>
              <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Edit</button>
            </div>
          )}
        </div>

        <div className="psw-footer">
          {step > 1 && (
            <button type="button" className="btn btn-outline" onClick={handleBack}>Back</button>
          )}
          <div className="psw-footer-spacer" />
          {step < TOTAL_STEPS ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>Next →</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>{isEditing ? 'Save changes' : 'Submit profile'}</button>
          )}
        </div>
      </div>

      <style>{`
        .psw-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(13, 18, 22, 0.55);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 60;
          padding: 16px;
          animation: psw-backdrop-in 0.18s ease-out;
        }

        .psw-modal {
          --psw-border: var(--border-color, #dfe4ea);
          --psw-surface: var(--surface-color, #ffffff);
          --psw-surface-muted: var(--surface-muted, #f6f8fa);
          --psw-text: var(--text-color, #1f2933);
          --psw-text-muted: var(--text-muted, #5a6570);
          --psw-accent: var(--accent-color, #1c6f5d);
          --psw-accent-soft: var(--accent-color-soft, #e4f2ee);
          --psw-danger: var(--danger-color, #b3401f);
          --psw-danger-soft: var(--danger-color-soft, #fbe9e3);
          background: var(--psw-surface);
          color: var(--psw-text);
          border-radius: 16px;
          width: 100%;
          max-width: 640px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 60px -12px rgba(15, 20, 25, 0.35), 0 2px 8px rgba(15, 20, 25, 0.08);
          animation: psw-modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes psw-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes psw-modal-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes psw-section-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .psw-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 22px 24px 18px;
          border-bottom: 1px solid var(--psw-border);
        }

        .psw-header h2 {
          margin: 0 0 4px;
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .psw-subtitle {
          margin: 0;
          font-size: 0.85rem;
          color: var(--psw-text-muted);
        }

        .psw-close {
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          color: var(--psw-text-muted);
          line-height: 1;
          padding: 6px;
          border-radius: 8px;
          flex-shrink: 0;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .psw-close:hover {
          background: var(--psw-surface-muted);
          color: var(--psw-text);
        }

        .psw-close:focus-visible {
          outline: 2px solid var(--psw-accent);
          outline-offset: 1px;
        }

        .psw-steps {
          display: flex;
          padding: 18px 24px;
          overflow-x: auto;
          scrollbar-width: thin;
          border-bottom: 1px solid var(--psw-border);
        }

        .psw-steps::-webkit-scrollbar {
          height: 4px;
        }

        .psw-steps::-webkit-scrollbar-thumb {
          background: var(--psw-border);
          border-radius: 4px;
        }

        .psw-step-dot {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1 0 32px;
          min-width: 32px;
        }

        /* Connecting rail between step circles — the segment leading into a step
           lights up once that step has been reached, so progress reads as a single
           continuous path rather than isolated dots. */
        .psw-step-dot:not(:first-child)::before {
          content: '';
          position: absolute;
          top: 13px;
          right: 50%;
          width: 100%;
          height: 2px;
          background: var(--psw-border);
          z-index: 0;
          transition: background-color 0.25s ease;
        }

        .psw-step-dot.psw-step-done::before,
        .psw-step-dot.psw-step-active::before {
          background: var(--psw-accent);
        }

        .psw-step-circle {
          position: relative;
          z-index: 1;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          border: 1.5px solid var(--psw-border);
          color: var(--psw-text-muted);
          background: var(--psw-surface);
          transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
        }

        .psw-step-active .psw-step-circle {
          border-color: var(--psw-accent);
          color: var(--psw-accent);
          background: var(--psw-accent-soft);
          box-shadow: 0 0 0 3px var(--psw-accent-soft);
        }

        .psw-step-done .psw-step-circle {
          border-color: var(--psw-accent);
          background: var(--psw-accent);
          color: #fff;
        }

        .psw-body {
          padding: 20px 24px 22px;
          overflow-y: auto;
          flex: 1;
          scrollbar-width: thin;
        }

        .psw-body::-webkit-scrollbar {
          width: 6px;
        }

        .psw-body::-webkit-scrollbar-thumb {
          background: var(--psw-border);
          border-radius: 6px;
        }

        .psw-section {
          animation: psw-section-in 0.2s ease-out;
        }

        .psw-section h3 {
          margin: 0 0 18px;
          font-size: 1.02rem;
          font-weight: 700;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--psw-border);
        }

        .psw-section select,
        .psw-section textarea {
          width: 100%;
          font: inherit;
          font-size: 0.95rem;
          padding: 9px 11px;
          border: 1px solid var(--psw-border);
          border-radius: 7px;
          background: var(--psw-surface);
          color: var(--psw-text);
          transition: border-color 0.15s ease;
        }

        .psw-section textarea {
          resize: vertical;
          min-height: 72px;
        }

        .psw-section select:focus,
        .psw-section textarea:focus,
        .psw-section input:focus {
          outline: 2px solid var(--psw-accent);
          outline-offset: 1px;
          border-color: var(--psw-accent);
        }

        .psw-section input:disabled,
        .psw-section select:disabled {
          background: var(--psw-surface-muted);
          color: var(--psw-text-muted);
          cursor: not-allowed;
        }

        .psw-hint {
          font-size: 0.82rem;
          color: var(--psw-text-muted);
          margin: 0 0 12px;
          padding: 8px 12px;
          background: var(--psw-surface-muted);
          border-radius: 8px;
        }

        .psw-group-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--psw-text-muted);
          margin: 20px 0 10px;
          padding-top: 14px;
          border-top: 1px solid var(--psw-border);
        }

        .psw-check {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 0.9rem;
          margin: 0 0 10px;
          cursor: pointer;
          width: fit-content;
        }

        .psw-check input {
          width: 16px;
          height: 16px;
          accent-color: var(--psw-accent);
          cursor: pointer;
        }

        .psw-bay-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }

        .psw-bay-row input {
          flex: 1;
          padding: 9px 11px;
          border: 1px solid var(--psw-border);
          border-radius: 7px;
          background: var(--psw-surface);
          color: var(--psw-text);
          transition: border-color 0.15s ease;
        }

        .psw-bay-remove {
          background: none;
          border: 1px solid var(--psw-border);
          border-radius: 7px;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          cursor: pointer;
          color: var(--psw-text-muted);
          transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
        }

        .psw-bay-remove:hover {
          border-color: var(--psw-danger);
          color: var(--psw-danger);
          background: var(--psw-danger-soft);
        }

        .psw-add-bay {
          margin-top: 4px;
        }

        /* Note: text-overflow doesn't apply to flex containers, so a very long
           uploaded filename will wrap rather than truncate with "…" — wrapping the
           filename in its own <span> in the JSX would let ellipsis work if needed. */
        .psw-upload-btn {
          display: inline-flex;
          align-items: center;
          max-width: 100%;
          cursor: pointer;
          width: fit-content;
          border-style: dashed !important;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }

        .psw-upload-btn:hover {
          background: var(--psw-surface-muted);
        }

        .psw-review-list {
          list-style: none;
          padding: 0;
          margin: 0 0 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.9rem;
        }

        .psw-review-list li {
          padding: 12px 14px;
          background: var(--psw-surface-muted);
          border: 1px solid var(--psw-border);
          border-radius: 9px;
          line-height: 1.5;
        }

        .psw-footer {
          display: flex;
          align-items: center;
          padding: 16px 24px;
          border-top: 1px solid var(--psw-border);
          background: var(--psw-surface);
        }

        .psw-footer-spacer {
          flex: 1;
        }

        [data-theme='dark'] .psw-modal {
          --psw-border: #333d47;
          --psw-surface: #1b222b;
          --psw-surface-muted: #222a34;
          --psw-text: #e7ebef;
          --psw-text-muted: #99a4b0;
          --psw-accent: #4fbf9f;
          --psw-accent-soft: rgba(79, 191, 159, 0.14);
          --psw-danger: #e2704f;
          --psw-danger-soft: rgba(226, 112, 79, 0.14);
        }

        [data-theme='dark'] .psw-backdrop {
          background: rgba(4, 6, 8, 0.65);
        }

        @media (max-width: 560px) {
          .psw-modal {
            max-height: 95vh;
            border-radius: 14px;
          }

          .psw-header,
          .psw-steps,
          .psw-body,
          .psw-footer {
            padding-left: 18px;
            padding-right: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .psw-backdrop,
          .psw-modal,
          .psw-section {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}