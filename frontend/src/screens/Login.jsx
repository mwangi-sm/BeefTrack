import { useState } from 'react'
import { Icon, IconPaths } from '../components/icons'

const eyeIcon = (
  <>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </>
)
const eyeOffIcon = (
  <>
    <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-7-11-7a18.53 18.53 0 015.06-5.94M9.9 4.24A10.4 10.4 0 0112 4c7 0 11 7 11 7a18.7 18.7 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
    <path d="M1 1l22 22" />
  </>
)

const initialState = {
  identifier: '', 
  password: '',
}

export function Login({ onBack = () => {}, onSubmit = () => {}, onSignup = () => {}, error = '' }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.identifier.trim()) e.identifier = 'Enter your email or phone number.'
    if (!form.password) e.password = 'Password is required.'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length === 0) onSubmit(form)
  }

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
          <h2>Welcome back</h2>
          <p>Log in with the email or phone number you signed up with.</p>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'var(--rust-50, #fdf1ec)',
                color: 'var(--rust-600)',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email or phone number</label>
              <input
                type="text"
                value={form.identifier}
                onChange={set('identifier')}
                placeholder="xxx@example.com or 07XX XXX XXX"
              />
              {errors.identifier && (
                <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>
                  {errors.identifier}
                </span>
              )}
            </div>

            <div className="field">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ink-600)', background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  <Icon size={16}>{showPassword ? eyeOffIcon : eyeIcon}</Icon>
                </button>
              </div>
              {errors.password && (
                <span style={{ display: 'block', marginTop: 5, fontSize: 12, color: 'var(--rust-600)' }}>
                  {errors.password}
                </span>
              )}
            </div>

            <button type="submit" className="btn btn-primary">Log in</button>
          </form>

          <p className="signup-fineprint">
            Don&apos;t have an account?{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onSignup() }}
              style={{ color: 'var(--maroon-800)', fontWeight: 600 }}
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login