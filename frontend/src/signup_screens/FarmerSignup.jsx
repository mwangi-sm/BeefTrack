import { useState } from 'react'
import { Icon, IconPaths } from '../components/icons'
import { FieldError, CountySelect, PasswordField, SignupShell, NameFields } from '../signup_screens/SignupKit'
import { PHONE_RE } from '../signup_screens/signupConstants'

const initialState = {
  firstName: '',
  lastName: '',
  nationalId: '',
  phone: '',
  farmName: '',
  county: '',
  location: '',
  password: '',
  confirmPassword: '',
}

export function FarmerSignup({ onSubmit = () => {}, onBack = () => {}, onLogin = () => {} }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
    if (!form.phone.trim()) e.phone = 'Phone number is required.'
    else if (!PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid Kenyan phone number.'
    if (!form.farmName.trim()) e.farmName = 'Farm name is required.'
    if (!form.county) e.county = 'Select a county.'
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
      const { confirmPassword, ...rest } = form
      onSubmit({ role: 'farmer', ...rest })
    }
  }

  return (
    <SignupShell
      badgeIcon={IconPaths.farm}
      badgeLabel="Farmer"
      title="Create your account"
      subtitle="Register your farm to start recording animals and health records."
      onBack={onBack}
      onLogin={onLogin}
    >
      <form onSubmit={handleSubmit}>
        <NameFields
          firstName={form.firstName}
          lastName={form.lastName}
          onFirstChange={set('firstName')}
          onLastChange={set('lastName')}
          firstError={errors.firstName}
          lastError={errors.lastName}
        />

        <div className="field-row">
          <div className="field">
            <label>National ID / Passport <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input value={form.nationalId} onChange={set('nationalId')} placeholder="ID or passport number" />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" />
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
          </div>
        </div>

        <div className="field">
          <label>Farm name</label>
          <input value={form.farmName} onChange={set('farmName')} placeholder="e.g. Thika Riverbend Ranch" />
          {errors.farmName && <FieldError>{errors.farmName}</FieldError>}
        </div>

        <div className="field-row">
          <div className="field">
            <label>County</label>
            <CountySelect value={form.county} onChange={set('county')} hasError={!!errors.county} />
            {errors.county && <FieldError>{errors.county}</FieldError>}
          </div>
          <div className="field">
            <label>Farm location <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input value={form.location} onChange={set('location')} placeholder="Nearest town or landmark" />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Create password</label>
            <PasswordField value={form.password} onChange={set('password')} hasError={!!errors.password} />
            {errors.password && <FieldError>{errors.password}</FieldError>}
          </div>
          <div className="field">
            <label>Confirm password</label>
            <PasswordField value={form.confirmPassword} onChange={set('confirmPassword')} hasError={!!errors.confirmPassword} />
            {errors.confirmPassword && <FieldError>{errors.confirmPassword}</FieldError>}
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          <Icon size={16}>{IconPaths.farm}</Icon>
          Create farmer account
        </button>
      </form>
    </SignupShell>
  )
}

export default FarmerSignup