import { useState, useRef } from 'react'
import { Icon, IconPaths } from '../components/icons'
import { FieldError, PasswordField, SignupShell } from './SignupKit'
import { PHONE_RE, buildingIcon } from './signupConstants'

const initialState = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  accountType: 'individual',
  profilePhoto: null,
}

export function TransporterSignup({ onSubmit = () => {}, onBack = () => {}, onLogin = () => {} }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileRef = useRef(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setForm((f) => ({ ...f, profilePhoto: file }))
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setForm((f) => ({ ...f, profilePhoto: null }))
    setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address.'
    if (!form.phone.trim()) e.phone = 'Phone number is required.'
    else if (!PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid Kenyan phone number.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 8) e.password = 'At least 8 characters.'
    if (!form.confirmPassword) e.confirmPassword = 'Confirm your password.'
    else if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match.'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length === 0) {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, profilePhoto, ...rest } = form
      onSubmit({ role: 'transporter', ...rest })
    }
  }

  return (
    <SignupShell
      badgeIcon={IconPaths.truck}
      badgeLabel="Transporter"
      title="Create your account"
      subtitle="Sign up as a transporter to receive and fulfill delivery assignments."
      onBack={onBack}
      onLogin={onLogin}
    >
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Full name *</label>
          <input value={form.fullName} onChange={set('fullName')} placeholder="e.g. David Mwangi" />
          {errors.fullName && <FieldError>{errors.fullName}</FieldError>}
        </div>

        <div className="field">
          <label>Email address *</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="name@example.com" />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </div>

        <div className="field">
          <label>Phone number *</label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" />
          {errors.phone && <FieldError>{errors.phone}</FieldError>}
        </div>

        <div className="field-row">
          <div className="field">
            <label>Password *</label>
            <PasswordField value={form.password} onChange={set('password')} hasError={!!errors.password} />
            {errors.password && <FieldError>{errors.password}</FieldError>}
          </div>
          <div className="field">
            <label>Confirm password *</label>
            <PasswordField value={form.confirmPassword} onChange={set('confirmPassword')} hasError={!!errors.confirmPassword} />
            {errors.confirmPassword && <FieldError>{errors.confirmPassword}</FieldError>}
          </div>
        </div>

        <div className="field">
          <label>Account type</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {[
              { key: 'individual', label: 'Individual transporter', icon: IconPaths.profile },
              { key: 'company', label: 'Transport company', icon: buildingIcon },
            ].map(({ key, label, icon }) => {
              const active = form.accountType === key
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setForm((f) => ({ ...f, accountType: key }))}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '11px 10px',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? 'var(--gold-600)' : 'var(--border-soft)'}`,
                    background: active ? 'var(--cream-100)' : 'transparent',
                    color: active ? 'var(--maroon-800)' : 'var(--ink-600)',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={16}>{icon}</Icon>
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="field">
          <label>Profile photo <span style={{ fontWeight: 400 }}>(optional)</span></label>
          <div className="photo-upload-wrap">
            {photoPreview ? (
              <div className="photo-preview">
                <img src={photoPreview} alt="Profile preview" />
                <button type="button" className="photo-remove" onClick={removePhoto}>
                  <Icon size={14}>{IconPaths.close}</Icon>
                </button>
              </div>
            ) : (
              <button type="button" className="photo-upload-btn" onClick={() => fileRef.current?.click()}>
                <Icon size={20}>{IconPaths.camera}</Icon>
                <span>Upload photo</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          <Icon size={16}>{IconPaths.truck}</Icon>
          Create transporter account
        </button>
      </form>
    </SignupShell>
  )
}

export default TransporterSignup
