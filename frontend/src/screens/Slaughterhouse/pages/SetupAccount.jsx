import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, IconPaths } from '../../../components/icons'
import { Panel } from '../../../components/DashboardBits'
import { DashHead } from '../../../components/DashHead'
import { getCurrentMockUser } from '../../../lib/mockAuth'
import { updateProfile } from '../services/slaughterhouseApi'

const checkIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
  </svg>
)

const FACILITY_DOCUMENTS = [
  { key: 'slaughterhouseLicence', label: 'Operating Licence', desc: 'Slaughterhouse operating licence from county government' },
  { key: 'kebsCertification', label: 'KEBS Certification', desc: 'Kenya Bureau of Standards certification' },
  { key: 'healthCert', label: 'Public Health Certificate', desc: 'Ministry of Health compliance certificate' },
  { key: 'foodSafetyCert', label: 'Food Safety Certificate', desc: 'HACCP or food safety management certification' },
  { key: 'environmentalPermit', label: 'Environmental Permit', desc: 'NEMA environmental compliance permit' },
  { key: 'wasteManagementPermit', label: 'Waste Management Permit', desc: 'Approved waste disposal plan' },
]

const PERSONNEL_DOCUMENTS = [
  { key: 'vetCertification', label: 'Veterinary Officer Cert', desc: 'Qualified veterinary officer on staff' },
  { key: 'meatInspectorCert', label: 'Meat Inspector Cert', desc: 'Certified meat inspector credentials' },
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
  { key: 'facility', label: 'Facility', icon: IconPaths.abattoir },
  { key: 'documents', label: 'Licences', icon: IconPaths.document },
  { key: 'personnel', label: 'Personnel', icon: IconPaths.health },
]

export function SetupAccount() {
  const navigate = useNavigate()
  const user = getCurrentMockUser()
  const fullname = user?.fullname || ''

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [capacity, setCapacity] = useState('')
  const [operatingHours, setOperatingHours] = useState('')
  const [chillingCapacity, setChillingCapacity] = useState('')
  const [waterSource, setWaterSource] = useState('')
  const [powerBackup, setPowerBackup] = useState('')
  const [docs, setDocs] = useState({})
  const [uploadingDoc, setUploadingDoc] = useState(null)
  const [vetName, setVetName] = useState('')
  const [vetLicense, setVetLicense] = useState('')
  const [supervisorName, setSupervisorName] = useState('')
  const [staffCount, setStaffCount] = useState('')

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

  async function handleFinish() {
    setSaving(true)
    try {
      await updateProfile({
        fullName: fullname,
        capacity,
        operatingHours,
        chillingCapacity,
        waterSource,
        powerBackup,
        vetName,
        vetLicense,
        supervisorName,
        staffCount,
      })
    } catch {
      // proceed even if update fails
    } finally {
      window.localStorage.setItem('beef_trace_slaughterhouse_setup_done', 'true')
      setSaving(false)
      navigate('/dashboard/slaughterhouse', { replace: true })
    }
  }

  function handleSkip() {
    navigate('/dashboard/slaughterhouse', { replace: true })
  }

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

  function renderFacilityStep() {
    return (
      <Panel title="Facility details">
        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 20px' }}>
          Tell us more about your slaughterhouse so livestock suppliers and transporters know what to expect.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field-row">
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Daily slaughter capacity</label>
              <input style={inputStyle} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 20 head of cattle" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Operating hours</label>
              <input style={inputStyle} value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} placeholder="e.g. 6 AM — 6 PM" />
            </div>
          </div>
          <div>
            <label style={fieldLabel}>Cold room / chilling capacity</label>
            <input style={inputStyle} value={chillingCapacity} onChange={(e) => setChillingCapacity(e.target.value)} placeholder="e.g. 40 carcasses" />
          </div>
          <div className="field-row">
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Water source</label>
              <input style={inputStyle} value={waterSource} onChange={(e) => setWaterSource(e.target.value)} placeholder="e.g. Municipal mains + borehole" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Power backup</label>
              <input style={inputStyle} value={powerBackup} onChange={(e) => setPowerBackup(e.target.value)} placeholder="e.g. 100 kVA generator" />
            </div>
          </div>
        </div>
      </Panel>
    )
  }

  function renderDocumentsStep() {
    const uploadedCount = FACILITY_DOCUMENTS.filter((d) => docs[d.key]).length
    const personnelUploaded = PERSONNEL_DOCUMENTS.filter((d) => docs[d.key]).length
    const totalDocs = FACILITY_DOCUMENTS.length + PERSONNEL_DOCUMENTS.length
    const totalUploaded = uploadedCount + personnelUploaded

    return (
      <Panel title="Upload licences & certifications">
        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 6px' }}>
          These documents are required for regulatory compliance. Upload more later from your Documents page.
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-900)', margin: '0 0 18px', fontWeight: 600 }}>
          {totalUploaded} of {totalDocs} uploaded
        </p>

        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Facility licences
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {FACILITY_DOCUMENTS.map((d) => {
            const doc = docs[d.key]
            const isUploading = uploadingDoc === d.key
            const status = DOC_STATUS[doc ? 'uploaded' : 'missing']

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
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>{d.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-600)', marginTop: 1 }}>
                    {doc ? `${doc.name} · ${(doc.size / 1024).toFixed(0)} KB` : d.desc}
                  </div>
                </div>
                <span className={`status-pill ${status.className}`} style={{ fontSize: 10.5 }}>{status.label}</span>
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

        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Personnel certifications
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PERSONNEL_DOCUMENTS.map((d) => {
            const doc = docs[d.key]
            const isUploading = uploadingDoc === d.key
            const status = DOC_STATUS[doc ? 'uploaded' : 'missing']

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
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>{d.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-600)', marginTop: 1 }}>
                    {doc ? `${doc.name} · ${(doc.size / 1024).toFixed(0)} KB` : d.desc}
                  </div>
                </div>
                <span className={`status-pill ${status.className}`} style={{ fontSize: 10.5 }}>{status.label}</span>
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

  function renderPersonnelStep() {
    return (
      <Panel title="Key personnel">
        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 20px' }}>
          Record the key staff responsible for inspection and operations.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field-row">
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Veterinary officer name</label>
              <input style={inputStyle} value={vetName} onChange={(e) => setVetName(e.target.value)} placeholder="Full name" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>License / Reg. number</label>
              <input style={inputStyle} value={vetLicense} onChange={(e) => setVetLicense(e.target.value)} placeholder="e.g. KVB-2024-00123" />
            </div>
          </div>
          <div className="field-row">
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Floor supervisor name</label>
              <input style={inputStyle} value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} placeholder="Full name" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Total staff count</label>
              <input style={inputStyle} value={staffCount} onChange={(e) => setStaffCount(e.target.value)} placeholder="e.g. 15" />
            </div>
          </div>
        </div>
      </Panel>
    )
  }

  const stepRenderers = [renderFacilityStep, renderDocumentsStep, renderPersonnelStep]

  return (
    <>
      <DashHead
        title="Set up your facility"
        subtitle="Add your facility details, licences, and key personnel to start receiving animals."
        actions={
          <button className="btn btn-outline" onClick={handleSkip} style={{ fontSize: 12.5 }}>
            Skip for now
          </button>
        }
      />

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {renderStepIndicator()}
        {stepRenderers[step]()}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {step > 0 && (
              <button className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>
                <Icon size={14}>{IconPaths.arrowLeft}</Icon> Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
                Next <Icon size={14}>{IconPaths.arrowRight}</Icon>
              </button>
            ) : (
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