/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Panel, NoteBanner } from '../../components/DashboardBits'
import { Icon, IconPaths } from '../../components/icons'
import { FieldError } from '../../signup_screens/SignupKit'

// ---- Config: everything a retailer can supply during setup ----------------
// Add/remove entries here to change what shows up — nothing else needs editing.
const DOCUMENTS = [
  { key: 'tradingLicenseDoc', label: 'Trading license', required: true, hint: 'Scan or photo of your current trading license.' },
  { key: 'kraCertDoc', label: 'KRA PIN certificate', required: true, hint: 'PDF or photo of your KRA PIN certificate.' },
  { key: 'businessRegDoc', label: 'Business registration certificate', required: false, hint: 'Certificate of Incorporation / business name registration, if applicable.' },
  { key: 'idDoc', label: 'Owner / contact National ID', required: true, hint: 'Front side of the National ID or passport bio page.' },
  { key: 'foodHandlingDoc', label: 'Public health / food handling license', required: false, hint: 'Required for butcheries and food outlets in most counties.' },
]

const STORE_CATEGORIES = ['Butchery', 'Supermarket', 'Restaurant / hotel supplier', 'Open-air market stall', 'Other retail outlet']

const MAX_FILE_MB = 5

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, size: file.size, type: file.type, dataUrl: reader.result })
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function UploadField({ label, hint, required, value, onChange, error }) {
  const inputId = `upload-${label.replace(/\s+/g, '-').toLowerCase()}`

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      onChange({ __error: `File is too large. Max ${MAX_FILE_MB}MB.` })
      return
    }
    const result = await fileToBase64(file)
    onChange(result)
  }

  return (
    <div className="field">
      <label>
        {label} {required ? <span style={{ color: 'var(--rust-600)' }}>*</span> : <span style={{ fontWeight: 400 }}>(optional)</span>}
      </label>
      <p style={{ margin: '0 0 6px', fontSize: 12.5, color: 'var(--ink-600)' }}>{hint}</p>

      {!value ? (
        <label
          htmlFor={inputId}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '10px 12px', borderRadius: 8, border: '1.5px dashed var(--border-soft)',
            background: 'var(--page-bg)', fontSize: 13.5, color: 'var(--ink-600)',
          }}
        >
          <Icon size={16}>{IconPaths.plus}</Icon>
          Choose file (image or PDF, max {MAX_FILE_MB}MB)
        </label>
      ) : (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border-soft)',
            background: 'var(--page-bg)', fontSize: 13.5,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Icon size={16}>{IconPaths.check}</Icon>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.name}</span>
          </span>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: 12.5 }}
            onClick={() => onChange(null)}
          >
            Remove
          </button>
        </div>
      )}
      <input id={inputId} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFile} />
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}

// Reads the setup fields already saved on the user object (if any) so
// re-visiting this page doesn't wipe out previous progress.
function initialStateFromUser(user) {
  const docs = {}
  DOCUMENTS.forEach(({ key }) => {
    docs[key] = user?.[key] || null
  })
  return {
    ...docs,
    storeCategory: user?.storeCategory || '',
    operatingHours: user?.operatingHours || '',
    staffCount: user?.staffCount || '',
    paymentMethod: user?.paymentMethod || 'mpesa',
    paymentDetail: user?.paymentDetail || '',
    termsAccepted: !!user?.setupComplete,
  }
}

export function retailerSetupCompletion(user) {
  const requiredDocs = DOCUMENTS.filter((d) => d.required)
  const docsDone = requiredDocs.filter((d) => !!user?.[d.key]).length
  const detailsDone = user?.storeCategory && user?.operatingHours ? 1 : 0
  const total = requiredDocs.length + 1
  const done = docsDone + detailsDone
  return { done, total, complete: done === total }
}

export function RetailerSetupPage({ user, onUpdateUser }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => initialStateFromUser(user))
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  function setDoc(key) {
    return (fileResult) => {
      if (fileResult?.__error) {
        setErrors((e) => ({ ...e, [key]: fileResult.__error }))
        return
      }
      setErrors((e) => ({ ...e, [key]: undefined }))
      setForm((f) => ({ ...f, [key]: fileResult }))
    }
  }

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  function validate() {
    const e = {}
    DOCUMENTS.filter((d) => d.required).forEach((d) => {
      if (!form[d.key]) e[d.key] = `${d.label} is required.`
    })
    if (!form.storeCategory) e.storeCategory = 'Select a store category.'
    if (!form.operatingHours.trim()) e.operatingHours = 'Let customers and inspectors know your hours.'
    if (!form.termsAccepted) e.termsAccepted = 'You need to accept this to finish setup.'
    return e
  }

  function handleSave(e) {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return

    if (onUpdateUser && user) {
      onUpdateUser({
        ...user,
        ...Object.fromEntries(DOCUMENTS.map((d) => [d.key, form[d.key]])),
        storeCategory: form.storeCategory,
        operatingHours: form.operatingHours,
        staffCount: form.staffCount,
        paymentMethod: form.paymentMethod,
        paymentDetail: form.paymentDetail,
        setupComplete: true,
      })
    }
    setSaved(true)
  }

  const { done, total } = retailerSetupCompletion(form)

  return (
    <>
      <Panel title="Complete your shop setup">
        <p style={{ fontSize: 13.5, color: 'var(--ink-600)', margin: '0 0 14px' }}>
          Verified retailers get a badge on their storefront and can start receiving and verifying batches
          immediately. {done} of {total} required steps done.
        </p>

        {saved && (
          <NoteBanner>
            <b>Setup saved.</b> You're all set — head back to your dashboard whenever you're ready.
          </NoteBanner>
        )}

        <form onSubmit={handleSave}>
          <h4 style={{ margin: '4px 0 10px', fontSize: 14 }}>Verification documents</h4>
          {DOCUMENTS.map((doc) => (
            <UploadField
              key={doc.key}
              label={doc.label}
              hint={doc.hint}
              required={doc.required}
              value={form[doc.key]}
              onChange={setDoc(doc.key)}
              error={errors[doc.key]}
            />
          ))}

          <h4 style={{ margin: '18px 0 10px', fontSize: 14 }}>Store details</h4>
          <div className="field-row">
            <div className="field">
              <label>Store category</label>
              <select value={form.storeCategory} onChange={setField('storeCategory')} style={selectStyle}>
                <option value="">Select category</option>
                {STORE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.storeCategory && <FieldError>{errors.storeCategory}</FieldError>}
            </div>
            <div className="field">
              <label>Operating hours</label>
              <input value={form.operatingHours} onChange={setField('operatingHours')} placeholder="e.g. Mon–Sat, 7am–7pm" />
              {errors.operatingHours && <FieldError>{errors.operatingHours}</FieldError>}
            </div>
          </div>

          <div className="field">
            <label>Number of staff using verification tools <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input type="number" min="0" value={form.staffCount} onChange={setField('staffCount')} placeholder="e.g. 3" />
          </div>

          <h4 style={{ margin: '18px 0 10px', fontSize: 14 }}>Payments <span style={{ fontWeight: 400, fontSize: 12.5, color: 'var(--ink-600)' }}>(optional — for future settlement features)</span></h4>
          <div className="field-row">
            <div className="field">
              <label>Payment method</label>
              <select value={form.paymentMethod} onChange={setField('paymentMethod')} style={selectStyle}>
                <option value="mpesa">M-Pesa till / paybill</option>
                <option value="bank">Bank account</option>
                <option value="none">Prefer not to add this now</option>
              </select>
            </div>
            <div className="field">
              <label>{form.paymentMethod === 'bank' ? 'Account number' : 'Till / paybill number'}</label>
              <input
                value={form.paymentDetail}
                onChange={setField('paymentDetail')}
                disabled={form.paymentMethod === 'none'}
                placeholder={form.paymentMethod === 'bank' ? 'e.g. 0123456789' : 'e.g. 174379'}
              />
            </div>
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '16px 0', fontSize: 13.5 }}>
            <input
              type="checkbox"
              checked={form.termsAccepted}
              onChange={(e) => setForm((f) => ({ ...f, termsAccepted: e.target.checked }))}
              style={{ marginTop: 3 }}
            />
            <span>
              I confirm the documents provided are accurate and I agree to only shelve and sell batches that
              have been verified through BeefTrace.
            </span>
          </label>
          {errors.termsAccepted && <FieldError>{errors.termsAccepted}</FieldError>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary">Save setup</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard/retailer')}>
              Back to dashboard
            </button>
          </div>
        </form>
      </Panel>
    </>
  )
}

const selectStyle = {
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid var(--border-soft)',
  background: 'var(--page-bg)',
  color: 'var(--ink-900)',
  fontSize: 13.5,
}

export default RetailerSetupPage
