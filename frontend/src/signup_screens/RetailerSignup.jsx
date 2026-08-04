import { useState } from 'react'
import { Icon, IconPaths } from '../components/icons'
import { FieldError, CountySelect, PasswordField, SignupShell, NameFields } from '../signup_screens/SignupKit'
import { PHONE_RE, EMAIL_RE } from '../signup_screens/signupConstants'

const initialState = {
  shopName: '',
  tradingLicenseNumber: '',
  county: '',
  address: '',
  contactFirstName: '',
  contactLastName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function RetailerSignup({ onSubmit = () => {}, onBack = () => {}, onLogin = () => {} }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.shopName.trim()) e.shopName = 'Shop name is required.'
    if (!form.county) e.county = 'Select a county.'
    if (!form.address.trim()) e.address = 'Shop address is required.'
    if (!form.contactFirstName.trim()) e.contactFirstName = 'First name is required.'
    if (!form.contactLastName.trim()) e.contactLastName = 'Last name is required.'
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
      const { confirmPassword, ...rest } = form
      onSubmit({ role: 'retailer', ...rest })
    }
  }

  return (
    <SignupShell
      badgeIcon={IconPaths.storefront}
      badgeLabel="Retailer"
      title="Register your shop"
      subtitle="Sign up to verify incoming batches and present traceable product to shoppers."
      onBack={onBack}
      onLogin={onLogin}
    >
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Shop / store name</label>
          <input value={form.shopName} onChange={set('shopName')} placeholder="e.g. Kiambu Fresh Butchery" />
          {errors.shopName && <FieldError>{errors.shopName}</FieldError>}
        </div>

        <div className="field">
          <label>Trading license number <span style={{ fontWeight: 400 }}>(optional)</span></label>
          <input value={form.tradingLicenseNumber} onChange={set('tradingLicenseNumber')} placeholder="e.g. TL-2026-00123" />
        </div>

        <div className="field-row">
          <div className="field">
            <label>County</label>
            <CountySelect value={form.county} onChange={set('county')} hasError={!!errors.county} />
            {errors.county && <FieldError>{errors.county}</FieldError>}
          </div>
          <div className="field">
            <label>Phone number</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" />
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
          </div>
        </div>

        <div className="field">
          <label>Shop address</label>
          <input value={form.address} onChange={set('address')} placeholder="Street, town or plot number" />
          {errors.address && <FieldError>{errors.address}</FieldError>}
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
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="name@shop.co.ke" />
          {errors.email && <FieldError>{errors.email}</FieldError>}
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
          <Icon size={16}>{IconPaths.storefront}</Icon>
          Create retailer account
        </button>
      </form>
    </SignupShell>
  )
}

export default RetailerSignup