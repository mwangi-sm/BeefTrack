import { useState } from 'react'
import { Icon, IconPaths } from '../components/icons'
import { FieldError, PasswordField, SignupShell, NameFields } from './SignupKit'
import { EMAIL_RE, PHONE_RE } from './signupConstants'

const ROLE_COPY = {
  vet: {
    badgeLabel: 'Vet',
    title: 'Create your vet account',
    subtitle: 'Start exploring BeefTrace veterinary workflows. Licence verification can be completed later.',
    button: 'Create vet account',
    icon: IconPaths.health,
  },
  trader: {
    badgeLabel: 'Trader',
    title: 'Create your trader account',
    subtitle: 'Start exploring BeefTrace trading workflows. Verification is required before regulated transactions.',
    button: 'Create trader account',
    icon: IconPaths.profile,
  },
}

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

export function BasicRoleSignup({ role, onSubmit = () => {}, onBack = () => {}, onLogin = () => {} }) {
  const copy = ROLE_COPY[role] || ROLE_COPY.trader
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.'
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
      onSubmit({
        role,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })
    }
  }

  return (
    <SignupShell
      badgeIcon={copy.icon}
      badgeLabel={copy.badgeLabel}
      title={copy.title}
      subtitle={copy.subtitle}
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
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            {errors.email && <FieldError>{errors.email}</FieldError>}
          </div>
          <div className="field">
            <label>Phone number</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" />
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
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
          <Icon size={16}>{copy.icon}</Icon>
          {copy.button}
        </button>
      </form>
    </SignupShell>
  )
}

export default BasicRoleSignup
