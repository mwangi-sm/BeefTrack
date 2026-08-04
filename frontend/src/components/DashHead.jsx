// DashHead.jsx code
export function DashHead({ greeting, title, subtitle, actions }) {
  return (
    <div className="dash-head">
      <div>
        <p className="eyebrow" style={{ color: 'var(--gold-600)' }}>{greeting}</p>
        <h1>{title}</h1>
        <p className="sub">{subtitle}</p>
      </div>
      {actions && <div className="quick-actions">{actions}</div>}
    </div>
  )
}
