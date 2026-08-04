//StaticScreens.jsx code
// Signup (login) and the role-not-built-yet Placeholder both live here since
// they're small, self-contained, and don't share logic with the rest of the app.
import { Icon, IconPaths } from '../../components/icons'
import { DashboardShell } from '../../components/DashboardShell'

export function Signup({ role, onBack, onSubmit }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', display: 'flex', flexDirection: 'column' }}>
      <div className="signup-top">
        <button className="back-link" onClick={onBack}>
          <Icon size={15}>{IconPaths.arrowLeft}</Icon>
          Back
        </button>
        <div className="wordmark">
          <span className="stampmark">BT</span>
          BeefTrace
        </div>
      </div>

      <div className="signup-wrap">
        <div className="signup-card">
          <span className="signup-role-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span>{role}</span>
          </span>
          <h2>Log in to BeefTrace</h2>
          <p>Enter your details to access your dashboard and continue your traceability work.</p>

          <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
            <div className="field">
              <label>Email address</label>
              <input type="email" placeholder="wanjiku@example.com" />
            </div>
            <div className="field">
              <label>Phone number</label>
              <input type="text" placeholder="+254 7XX XXX XXX" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" type="submit">Log In</button>
          </form>
          <p className="signup-fineprint">Use the same email, phone number, and password linked to your BeefTrace account.</p>
        </div>
      </div>
    </div>
  )
}

export function Placeholder({ roleName, onBack, onToggleTheme = () => {}, onLogout = () => {} }) {
  return (
    <DashboardShell
      variant="secondary"
      onToggleTheme={onToggleTheme}
      onLogout={onLogout}
      onGoHome={onBack}
      roleLabel="BEEFTRACE"
      actorId=""
      name=""
      navItems={[{ label: 'Back', icon: IconPaths.home, onClick: onBack }]}
    >
      <div className="signup-wrap">
        <div className="signup-card" style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--cream-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Icon size={26} style={{ color: 'var(--gold-600)' }}>{IconPaths.alert}</Icon>
          </div>
          <h2>{roleName} dashboard isn't built yet</h2>
          <p>Tell Claude which role to build next and it'll show up here.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onBack}>Back to role picker</button>
        </div>
      </div>
    </DashboardShell>
  )
}