import { useState } from 'react'
import { Icon, IconPaths } from '../components/icons'
import { KENYA_COUNTIES, eyeIcon, eyeOffIcon } from '../signup_screens/signupConstants'

export function FieldError({ children }) {
  return (
    <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>
      {children}
    </span>
  )
}

export function NameFields({ firstName, lastName, onFirstChange, onLastChange, firstError, lastError, firstLabel = 'First name', lastLabel = 'Last name' }) {
  return (
    <div className="field-row">
      <div className="field">
        <label>{firstLabel}</label>
        <input value={firstName} onChange={onFirstChange} placeholder="Rehema" />
        {firstError && <FieldError>{firstError}</FieldError>}
      </div>
      <div className="field">
        <label>{lastLabel}</label>
        <input value={lastName} onChange={onLastChange} placeholder="Bakari" />
        {lastError && <FieldError>{lastError}</FieldError>}
      </div>
    </div>
  )
}

export function CountySelect({ value, onChange, hasError }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        padding: '11px 14px',
        borderRadius: 10,
        border: `1.5px solid ${hasError ? 'var(--rust-600)' : focused ? 'var(--gold-600)' : 'var(--border-soft)'}`,
        background: 'var(--page-bg)',
        color: value ? 'var(--ink-900)' : 'var(--ink-600)',
        fontSize: 14,
        fontFamily: 'inherit',
        appearance: 'none',
        cursor: 'pointer',
      }}
    >
      <option value="">Select county</option>
      {KENYA_COUNTIES.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  )
}

export function PasswordField({ value, onChange, hasError }) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="At least 8 characters"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '11px 40px 11px 14px',
          borderRadius: 10,
          border: `1.5px solid ${hasError ? 'var(--rust-600)' : focused ? 'var(--gold-600)' : 'var(--border-soft)'}`,
          background: 'var(--page-bg)',
          color: 'var(--ink-900)',
          fontSize: 14,
          fontFamily: 'inherit',
        }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink-600)',
        }}
      >
        <Icon size={16}>{show ? eyeOffIcon : eyeIcon}</Icon>
      </button>
    </div>
  )
}

// Shared chrome for every signup screen: top bar, wordmark, role badge,
// heading/subtitle, and the "already have an account" fineprint.
// Pass the <form> itself (with its own onSubmit) as children.
export function SignupShell({ badgeIcon, badgeLabel, title, subtitle, onBack = () => {}, onLogin = () => {}, children }) {
  return (
    <div id="screen-signup">
      <div className="signup-top">
        <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); onBack() }}>
          <Icon>{IconPaths.arrowLeft}</Icon> Back
        </a>
        <div className="wordmark">
          <span className="stampmark">BT</span>
          BeefTrace
        </div>
      </div>

      <div className="signup-wrap">
        <div className="signup-card">
          <div className="signup-role-badge">
            <Icon size={14}>{badgeIcon}</Icon> {badgeLabel}
          </div>
          <h2>{title}</h2>
          <p>{subtitle}</p>

          {children}

          <p className="signup-fineprint">
            Already have an account?{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onLogin() }}
              style={{ color: 'var(--maroon-800)', fontWeight: 600 }}
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}