import { useState, useRef } from 'react'
import { Icon, IconPaths } from '../components/icons'
import { FieldError, PasswordField, SignupShell } from './SignupKit'
import { PHONE_RE, EMAIL_RE } from './signupConstants'

const initialState = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  profilePhoto: null,
}

export function SlaughterhouseSignup({ onSubmit = () => {}, onBack = () => {}, onLogin = () => {} }) {
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
    if (!form.phone.trim()) e.phone = 'Phone number is required.'
    else if (!PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid Kenyan phone number.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.'
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
      onSubmit({ role: 'slaughterhouse', ...rest })
    }
  }

  return (
    <SignupShell
      badgeIcon={IconPaths.abattoir}
      badgeLabel="Slaughter House"
      title="Create your account"
      subtitle="Sign up to receive and process animals at your licensed facility."
      onBack={onBack}
      onLogin={onLogin}
    >
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Full name *</label>
          <input value={form.fullName} onChange={set('fullName')} placeholder="e.g. Rehema Bakari" />
          {errors.fullName && <FieldError>{errors.fullName}</FieldError>}
        </div>

        <div className="field">
          <label>Email address *</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="name@facility.co.ke" />
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
          <Icon size={16}>{IconPaths.abattoir}</Icon>
          Create slaughterhouse account
        </button>
      </form>
    </SignupShell>
  )
}

export default SlaughterhouseSignup
