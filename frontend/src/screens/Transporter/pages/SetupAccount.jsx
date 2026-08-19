import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, IconPaths } from '../../../components/icons'
import { Panel } from '../../../components/DashboardBits'
import { DashHead } from '../../../components/DashHead'
import { updateProfile } from '../services/transporterApi'

const checkIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
  </svg>
)

const INDIVIDUAL_DOCUMENTS = [
  { key: 'nationalId', label: 'ID/Passport', desc: 'Government-issued photo ID' },
  { key: 'drivingLicence', label: "Driver's license", desc: 'Valid driving licence' },
  { key: 'vehicleInsurance', label: 'Vehicle Insurance certificate', desc: 'Current insurance certificate' },
  { key: 'transportPermit', label: 'Transport permit', desc: 'Permit from relevant authority' },
  { key: 'passportPhoto', label: 'Passport photo', desc: 'Recent passport-size photo' },
]

const COMPANY_DOCUMENTS = [
  ...INDIVIDUAL_DOCUMENTS,
  { key: 'businessRegCert', label: 'Business registration certificate', desc: 'Certificate of incorporation/registration' },
  { key: 'kraPinCert', label: 'KRA PIN certificate', desc: 'Optional — KRA tax compliance' },
]

const DOC_STATUS = {
  uploaded: { label: 'Uploaded', className: 'status-ok' },
  missing: { label: 'Required', className: 'status-overdue' },
}

const fieldLabel = { fontSize: 12.5, fontWeight: 600, color: 'var(--ink-900)', marginBottom: 6, display: 'block' }
const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1.5px solid var(--border-soft)',
  background: 'var(--page-bg)',
  color: 'var(--ink-900)',
  fontFamily: 'inherit',
  fontSize: 13.5,
  boxSizing: 'border-box',
}

const STEPS = [
  { key: 'details', label: 'Transporter Details', icon: IconPaths.profile },
  { key: 'vehicle', label: 'Vehicle Information', icon: IconPaths.truck },
  { key: 'documents', label: 'Upload Documents', icon: IconPaths.document },
]

const VEHICLE_TYPES = ['Truck', 'Refrigerated truck', 'Van']

export function SetupAccount({ user }) {
  const navigate = useNavigate()
  const fullname = user?.fullname || ''
  const signupAccountType = user?.accountType || 'individual'
  const isCompany = signupAccountType === 'company'

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Step 1 — Transporter Details
  const [nationalId, setNationalId] = useState('')
  const [driversLicense, setDriversLicense] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [businessRegNo, setBusinessRegNo] = useState('')
  const [contactPerson, setContactPerson] = useState('')

  // Step 1 errors
  const [detailsErrors, setDetailsErrors] = useState({})

  // Step 2 — Vehicle Information
  const [vehicleReg, setVehicleReg] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleTypeOther, setVehicleTypeOther] = useState('')
  const [vehicleCapacity, setVehicleCapacity] = useState('')
  const [refrigeration, setRefrigeration] = useState('')
  const [vehicleErrors, setVehicleErrors] = useState({})

  // Step 3 — Documents
  const [docs, setDocs] = useState({})
  const [uploadingDoc, setUploadingDoc] = useState(null)
  const fileInputRef = useRef(null)
  const pendingDocKey = useRef(null)

  function triggerDocUpload(key) {
    pendingDocKey.current = key
    fileInputRef.current?.click()
  }

  function handleDocFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    const key = pendingDocKey.current
    if (!file || !key) return

    setUploadingDoc(key)
    const reader = new FileReader()
    reader.onload = () => {
      setDocs((prev) => ({
        ...prev,
        [key]: { name: file.name, size: file.size, status: 'pending_review', dataUrl: reader.result },
      }))
      setUploadingDoc(null)
    }
    reader.readAsDataURL(file)
  }

  function validateDetails() {
    const e = {}
    if (isCompany) {
      if (!companyName.trim()) e.companyName = 'Company name is required.'
      if (!businessRegNo.trim()) e.businessRegNo = 'Business registration number is required.'
      if (!contactPerson.trim()) e.contactPerson = 'Company contact person is required.'
    } else {
      if (!nationalId.trim()) e.nationalId = 'National ID number is required.'
      if (!driversLicense.trim()) e.driversLicense = "Driver's license number is required."
      if (!licenseExpiry.trim()) e.licenseExpiry = 'License expiry date is required.'
    }
    return e
  }

  function validateVehicle() {
    const e = {}
    if (!vehicleReg.trim()) e.vehicleReg = 'Vehicle registration number is required.'
    if (!vehicleType) e.vehicleType = 'Select a vehicle type.'
    if (vehicleType === 'Other' && !vehicleTypeOther.trim()) e.vehicleTypeOther = 'Please specify vehicle type.'
    if (!vehicleCapacity.trim()) e.vehicleCapacity = 'Vehicle capacity is required.'
    if (!refrigeration) e.refrigeration = 'Indicate if refrigeration is available.'
    return e
  }

  function canProceedToVehicle() {
    const e = validateDetails()
    setDetailsErrors(e)
    return Object.keys(e).length === 0
  }

  function canProceedToDocuments() {
    const e = validateVehicle()
    setVehicleErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleFinish() {
    setSaveError('')
    setSaving(true)
    try {
      const profileData = {
        fullName: fullname,
        accountType: signupAccountType,
        nationalId,
        driversLicense,
        licenseExpiry,
        companyName,
        businessRegNo,
        contactPerson,
        vehicleReg,
        vehicleType: vehicleType === 'Other' ? vehicleTypeOther : vehicleType,
        vehicleCapacity,
        refrigeration,
      }
      await updateProfile(profileData)
      setSaving(false)
      navigate('/dashboard/transporter', { replace: true })
    } catch (error) {
      setSaveError(error.message || 'Unable to save your account setup. Please try again.')
      setSaving(false)
    }
  }

  function handleSkip() {
    // Don't mark setup as done — the dashboard banner will persist so they
    // can come back to complete setup later. They can still accept pickups.
    navigate('/dashboard/transporter', { replace: true })
  }

  // ── Step indicator ──
  function renderStepIndicator() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
        {STEPS.map((s, i) => {
          const isActive = i === step
          const isDone = i < step
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <div style={{
                  width: 40, height: 2,
                  background: isDone ? 'var(--gold-600)' : 'var(--border-soft)',
                  margin: '0 4px',
                }} />
              )}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                opacity: isActive || isDone ? 1 : 0.45,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: isDone ? 'var(--gold-600)' : isActive ? 'var(--maroon-800)' : 'var(--cream-100)',
                  color: isDone || isActive ? 'var(--cream-100)' : 'var(--ink-600)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                }}>
                  {isDone ? '✓' : <Icon size={16}>{s.icon}</Icon>}
                </div>
                <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: 'var(--ink-900)' }}>
                  {s.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Step 1: Transporter Details ──
  function renderDetailsStep() {
    return (
      <Panel title="Transporter Details">
        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 20px' }}>
          Provide your personal or company details as the registered transporter.
          {isCompany && ' You selected "Transport company" during signup.'}
        </p>

        {isCompany ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label style={fieldLabel}>Company name *</label>
              <input style={inputStyle} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Kiambu Cargo Movers Ltd" />
              {detailsErrors.companyName && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{detailsErrors.companyName}</span>}
            </div>
            <div className="field">
              <label style={fieldLabel}>Business registration number *</label>
              <input style={inputStyle} value={businessRegNo} onChange={(e) => setBusinessRegNo(e.target.value)} placeholder="e.g. BN-2024-00123" />
              {detailsErrors.businessRegNo && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{detailsErrors.businessRegNo}</span>}
            </div>
            <div className="field">
              <label style={fieldLabel}>Company contact person *</label>
              <input style={inputStyle} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g. Jane Wanjiku" />
              {detailsErrors.contactPerson && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{detailsErrors.contactPerson}</span>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label style={fieldLabel}>National ID number *</label>
              <input style={inputStyle} value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="e.g. 12345678" />
              {detailsErrors.nationalId && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{detailsErrors.nationalId}</span>}
            </div>
            <div className="field-row" style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Driver's license number *</label>
                <input style={inputStyle} value={driversLicense} onChange={(e) => setDriversLicense(e.target.value)} placeholder="e.g. DL-2024-56789" />
                {detailsErrors.driversLicense && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{detailsErrors.driversLicense}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>License expiry date *</label>
                <input style={inputStyle} type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
                {detailsErrors.licenseExpiry && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{detailsErrors.licenseExpiry}</span>}
              </div>
            </div>
          </div>
        )}
      </Panel>
    )
  }

  // ── Step 2: Vehicle Information ──
  function renderVehicleStep() {
    return (
      <Panel title="Vehicle Information">
        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 20px' }}>
          Provide details about the vehicle used for livestock transport.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label style={fieldLabel}>Vehicle registration number *</label>
            <input style={inputStyle} value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} placeholder="e.g. KDA 123A" />
            {vehicleErrors.vehicleReg && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{vehicleErrors.vehicleReg}</span>}
          </div>

          <div className="field">
            <label style={fieldLabel}>Vehicle type *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[...VEHICLE_TYPES, 'Other'].map((type) => {
                const active = vehicleType === type
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setVehicleType(type)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: `1.5px solid ${active ? 'var(--gold-600)' : 'var(--border-soft)'}`,
                      background: active ? 'var(--cream-100)' : 'transparent',
                      color: active ? 'var(--maroon-800)' : 'var(--ink-600)',
                      fontWeight: active ? 600 : 400,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
            {vehicleErrors.vehicleType && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{vehicleErrors.vehicleType}</span>}
            {vehicleType === 'Other' && (
              <div style={{ marginTop: 10 }}>
                <input
                  style={inputStyle}
                  value={vehicleTypeOther}
                  onChange={(e) => setVehicleTypeOther(e.target.value)}
                  placeholder="Specify vehicle type"
                />
                {vehicleErrors.vehicleTypeOther && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{vehicleErrors.vehicleTypeOther}</span>}
              </div>
            )}
          </div>

          <div className="field">
            <label style={fieldLabel}>Vehicle capacity *</label>
            <input style={inputStyle} value={vehicleCapacity} onChange={(e) => setVehicleCapacity(e.target.value)} placeholder="e.g. 5 tonnes / 4 head of cattle" />
            {vehicleErrors.vehicleCapacity && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{vehicleErrors.vehicleCapacity}</span>}
          </div>

          <div className="field">
            <label style={fieldLabel}>Refrigeration available *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Yes', 'No'].map((opt) => {
                const active = refrigeration === opt
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setRefrigeration(opt)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: `1.5px solid ${active ? 'var(--gold-600)' : 'var(--border-soft)'}`,
                      background: active ? 'var(--cream-100)' : 'transparent',
                      color: active ? 'var(--maroon-800)' : 'var(--ink-600)',
                      fontWeight: active ? 600 : 400,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {vehicleErrors.refrigeration && <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>{vehicleErrors.refrigeration}</span>}
          </div>
        </div>
      </Panel>
    )
  }

  // ── Step 3: Upload Documents ──
  function renderDocumentsStep() {
    const docList = isCompany ? COMPANY_DOCUMENTS : INDIVIDUAL_DOCUMENTS
    const requiredDocs = isCompany
      ? COMPANY_DOCUMENTS.filter((d) => d.key !== 'kraPinCert')
      : INDIVIDUAL_DOCUMENTS
    const uploadedCount = requiredDocs.filter((d) => docs[d.key]).length
    const totalRequired = requiredDocs.length

    return (
      <Panel title="Upload Documents">
        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 6px' }}>
          Upload the required documents for verification. You can also upload them later from your Documents page.
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-900)', margin: '0 0 18px', fontWeight: 600 }}>
          {uploadedCount} of {totalRequired} required documents uploaded
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docList.map((d) => {
            const isOptional = d.key === 'kraPinCert'
            const doc = docs[d.key]
            const isUploading = uploadingDoc === d.key
            const status = doc ? DOC_STATUS.uploaded : DOC_STATUS.missing

            return (
              <div key={d.key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10,
                border: '1.5px solid var(--border-soft)',
                background: doc ? 'var(--cream-50)' : 'var(--page-bg)',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: doc ? 'var(--gold-50)' : 'var(--cream-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={15} color={doc ? 'var(--gold-600)' : 'var(--ink-600)'}>{IconPaths.document}</Icon>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>
                    {d.label} {isOptional && <span style={{ fontWeight: 400, color: 'var(--ink-600)', fontSize: 12 }}>(optional)</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-600)', marginTop: 1 }}>
                    {doc ? `${doc.name} · ${(doc.size / 1024).toFixed(0)} KB` : d.desc}
                  </div>
                </div>

                <span className={`status-pill ${status.className}`} style={{ fontSize: 10.5 }}>
                  {status.label}
                </span>

                <button
                  className="btn btn-primary"
                  onClick={() => triggerDocUpload(d.key)}
                  disabled={isUploading}
                  style={{ padding: '5px 12px', fontSize: 11.5, flexShrink: 0 }}
                >
                  {isUploading ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
                </button>
              </div>
            )
          })}
        </div>
      </Panel>
    )
  }

  const stepRenderers = [renderDetailsStep, renderVehicleStep, renderDocumentsStep]

  return (
    <>
      <DashHead
        title="Set up your account"
        subtitle="Complete these steps to start accepting delivery assignments."
        actions={
          <button className="btn btn-outline" onClick={handleSkip} style={{ fontSize: 12.5 }}>
            Skip for now
          </button>
        }
      />

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--cream-100)', padding: '5px 14px', borderRadius: 20,
          fontSize: 13, fontWeight: 600, color: 'var(--maroon-800)', marginBottom: 14,
          marginLeft: 'calc((100% - 640px) / 2 + 20px)',
        }}>
          <Icon size={14}>{IconPaths.truck}</Icon>
          Transporter setup
        </div>

        {renderStepIndicator()}
        {stepRenderers[step]()}

        {saveError && (
          <p role="alert" style={{ margin: '16px 0 0', color: 'var(--rust-600)', fontSize: 13 }}>
            {saveError}
          </p>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {step > 0 && (
              <button className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>
                <Icon size={14}>{IconPaths.arrowLeft}</Icon> Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {step === 0 && (
              <button className="btn btn-primary" onClick={() => { if (canProceedToVehicle()) setStep(1) }}>
                Next <Icon size={14}>{IconPaths.arrowRight}</Icon>
              </button>
            )}
            {step === 1 && (
              <button className="btn btn-primary" onClick={() => { if (canProceedToDocuments()) setStep(2) }}>
                Next <Icon size={14}>{IconPaths.arrowRight}</Icon>
              </button>
            )}
            {step === 2 && (
              <button className="btn btn-primary" onClick={handleFinish} disabled={saving} style={{ minWidth: 180 }}>
                {saving ? 'Saving…' : <>{checkIcon}<span style={{ marginLeft: 6 }}>Go to dashboard</span></>}
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleDocFile}
          style={{ display: 'none' }}
        />
      </div>
    </>
  )
}

export default SetupAccount
