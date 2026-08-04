import { useState } from 'react'
import { Icon, IconPaths } from '../components/icons'
import { FieldError, PasswordField, SignupShell, NameFields } from '../signup_screens/SignupKit'
import { EMAIL_RE } from '../signup_screens/signupConstants'

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

export function ConsumerSignup({ onSubmit = () => {}, onBack = () => {}, onLogin = () => {} }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
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
      const { confirmPassword, ...rest } = form
      onSubmit({ role: 'consumer', ...rest })
    }
  }

  return (
    <SignupShell
      badgeIcon={IconPaths.search}
      badgeLabel="Consumer"
      title="Create your account"
      subtitle="Sign up to scan QR codes and view the full farm-to-plate history of your beef."
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

        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </div>

        <div className="field">
          <label>Phone number <span style={{ fontWeight: 400 }}>(optional)</span></label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" />
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
          <Icon size={16}>{IconPaths.search}</Icon>
          Create account
        </button>
      </form>
    </SignupShell>
  )
}

export default ConsumerSignup