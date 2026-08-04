import { Icon, IconPaths } from '../components/icons'

export function Placeholder({ roleName, onBack }) {
  return (
    <>
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
        <div className="signup-card" style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--cream-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Icon size={26} style={{ color: 'var(--gold-600)' }}>{IconPaths.alert}</Icon>
          </div>
          <h2>{roleName} dashboard isn't built yet</h2>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onBack}>Back to dashboard</button>
        </div>
      </div>
    </>
  )
}
