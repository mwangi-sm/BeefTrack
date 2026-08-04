//SetupBits.jsx code
import './SetupBits.css'

export function SetupShell({ title, subtitle, onBack, children }) {
  return (
    <div className="setup-shell">
      <div className="setup-top">
        <button className="back-link" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to dashboard
        </button>
        <div className="wordmark">
          <span className="stampmark">BT</span>
          BeefTrace
        </div>
      </div>

      <div className="setup-wrap">
        <div className="setup-card">
          <p className="setup-title">{title}</p>
          {subtitle && <p className="setup-subtitle">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}

export function SectionTitle({ children }) {
  return <h3 className="form-section-title">{children}</h3>
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function Field({ label, hint, htmlFor, children }) {
  return (
    <div className="setup-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

export function TextInput({ label, hint, type = 'text', id, ...props }) {
  const fieldId = id || slug(label)
  return (
    <Field label={label} hint={hint} htmlFor={fieldId}>
      <input id={fieldId} type={type} {...props} />
    </Field>
  )
}

export function SelectInput({ label, hint, options, id, ...props }) {
  const fieldId = id || slug(label)
  return (
    <Field label={label} hint={hint} htmlFor={fieldId}>
      <select id={fieldId} {...props}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  )
}

export function TextArea({ label, hint, id, ...props }) {
  const fieldId = id || slug(label)
  return (
    <Field label={label} hint={hint} htmlFor={fieldId}>
      <textarea id={fieldId} rows={3} {...props} />
    </Field>
  )
}

// Single-select pill group — click one option, it highlights, no typing needed.
export function PillGroup({ label, hint, options, value, onChange }) {
  return (
    <Field label={label} hint={hint}>
      <div className="pill-group">
        {options.map((o) => (
          <button
            type="button"
            key={o}
            className={`pill${value === o ? ' pill-selected' : ''}`}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </Field>
  )
}

// Multi-select checkbox group — click any number of options.
export function CheckboxGroup({ label, hint, options, values, onChange }) {
  const toggle = (o) => {
    onChange(values.includes(o) ? values.filter((v) => v !== o) : [...values, o])
  }
  return (
    <Field label={label} hint={hint}>
      <div className="pill-group">
        {options.map((o) => (
          <button
            type="button"
            key={o}
            className={`pill${values.includes(o) ? ' pill-selected' : ''}`}
            onClick={() => toggle(o)}
          >
            {values.includes(o) && '✓ '}{o}
          </button>
        ))}
      </div>
    </Field>
  )
}

export function FileInput({ label, hint, multiple = false, id, ...props }) {
  const fieldId = id || slug(label)
  return (
    <Field label={label} hint={hint} htmlFor={fieldId}>
      <div className="file-input">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        </svg>
        <span>{multiple ? 'Click to upload files' : 'Click to upload a file'}</span>
        <input id={fieldId} type="file" multiple={multiple} {...props} />
      </div>
    </Field>
  )
}

export function FieldRow({ children }) {
  return <div className="setup-field-row">{children}</div>
}

export function GpsField({ label, hint, value, onChange }) {
  const fieldId = slug(label)
  const useCurrentLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => onChange('Location unavailable — enter manually')
    )
  }
  return (
    <Field label={label} hint={hint} htmlFor={fieldId}>
      <div className="gps-field">
        <input
          id={fieldId}
          type="text"
          placeholder="Latitude, longitude"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="btn btn-outline gps-btn" onClick={useCurrentLocation}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
            <path d="M12 21s-7-4.5-7-10a7 7 0 0114 0c0 5.5-7 10-7 10z" /><circle cx="12" cy="11" r="2.5" />
          </svg>
          Pin current location
        </button>
      </div>
    </Field>
  )
}

export function SetupActions({ children }) {
  return <div className="setup-actions">{children}</div>
}
