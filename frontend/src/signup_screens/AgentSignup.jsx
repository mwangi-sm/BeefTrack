import { useState } from 'react'
import { Icon, IconPaths } from '../components/icons'
import { FieldError, CountySelect, PasswordField, SignupShell, NameFields } from '../signup_screens/SignupKit'
import { PHONE_RE, buildingIcon, peopleIcon } from '../signup_screens/signupConstants'

const initialState = {
  agentType: 'individual',
  firstName: '',
  lastName: '',
  nationalId: '',
  phone: '',
  county: '',
  yardLocation: '',
  companyName: '',
  contactFirstName: '',
  contactLastName: '',
  businessRegNumber: '',
  password: '',
  confirmPassword: '',
}

export function AgentSignup({ onSubmit = () => {}, onBack = () => {}, onLogin = () => {} }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const isCompany = form.agentType === 'company'

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const e = {}
    if (isCompany) {
      if (!form.companyName.trim()) e.companyName = 'Company name is required.'
      if (!form.contactFirstName.trim()) e.contactFirstName = 'First name is required.'
      if (!form.contactLastName.trim()) e.contactLastName = 'Last name is required.'
    } else {
      if (!form.firstName.trim()) e.firstName = 'First name is required.'
      if (!form.lastName.trim()) e.lastName = 'Last name is required.'
    }
    if (!form.phone.trim()) e.phone = 'Phone number is required.'
    else if (!PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid Kenyan phone number.'
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
      const {  ...rest } = form
      onSubmit({ role: 'agent', ...rest })
    }
  }

  return (
    <SignupShell
      badgeIcon={peopleIcon}
      badgeLabel="Agent"
      title="Create your account"
      subtitle="Register as an independent livestock agent or a trading company."
      onBack={onBack}
      onLogin={onLogin}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {[
            { key: 'individual', label: 'Individual', icon: IconPaths.profile },
            { key: 'company', label: 'Company', icon: buildingIcon },
          ].map(({ key, label, icon }) => {
            const active = form.agentType === key
            return (
              <button
                type="button"
                key={key}
                onClick={() => setForm((f) => ({ ...f, agentType: key }))}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 10px', borderRadius: 10,
                  border: `1.5px solid ${active ? 'var(--gold-600)' : 'var(--border-soft)'}`,
                  background: active ? 'var(--cream-100)' : 'transparent',
                  color: active ? 'var(--maroon-800)' : 'var(--ink-600)',
                  fontWeight: 600, fontSize: 13.5,
                }}
              >
                <Icon size={16}>{icon}</Icon>
                {label}
              </button>
            )
          })}
        </div>

        {isCompany ? (
          <>
            <div className="field">
              <label>Company name</label>
              <input value={form.companyName} onChange={set('companyName')} placeholder="e.g. Ruiru Livestock Traders Ltd" />
              {errors.companyName && <FieldError>{errors.companyName}</FieldError>}
            </div>
            <NameFields
              firstName={form.contactFirstName}
              lastName={form.contactLastName}
              onFirstChange={set('contactFirstName')}
              onLastChange={set('contactLastName')}
              firstError={errors.contactFirstName}
              lastError={errors.contactLastName}
              firstLabel="Contact first name"
              lastLabel="Contact last name"
            />
            <div className="field">
              <label>Business registration number <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input value={form.businessRegNumber} onChange={set('businessRegNumber')} placeholder="e.g. BN-2024-00123" />
            </div>
          </>
        ) : (
          <>
            <NameFields
              firstName={form.firstName}
              lastName={form.lastName}
              onFirstChange={set('firstName')}
              onLastChange={set('lastName')}
              firstError={errors.firstName}
              lastError={errors.lastName}
            />
            <div className="field">
              <label>National ID / Passport <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input value={form.nationalId} onChange={set('nationalId')} placeholder="ID or passport number" />
            </div>
          </>
        )}

        <div className="field-row">
          <div className="field">
            <label>Phone number</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" />
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
          </div>
          <div className="field">
            <label>County</label>
            <CountySelect value={form.county} onChange={set('county')} hasError={!!errors.county} />
            {errors.county && <FieldError>{errors.county}</FieldError>}
          </div>
        </div>

        <div className="field">
          <label>Yard / holding location <span style={{ fontWeight: 400 }}>(optional)</span></label>
          <input value={form.yardLocation} onChange={set('yardLocation')} placeholder="e.g. Ruiru yard" />
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
          <Icon size={16}>{peopleIcon}</Icon>
          Create agent account
        </button>
      </form>
    </SignupShell>
  )
}

export default AgentSignup