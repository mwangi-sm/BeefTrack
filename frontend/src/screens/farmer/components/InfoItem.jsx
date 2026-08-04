// InfoItem.jsx code
import '../../../components/DetailView.css'

export function InfoItem({ label, value }) {
  const isEmpty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
  return (
    <div className="info-item">
      <p className="info-label">{label}</p>
      <p className={`info-value${isEmpty ? ' muted' : ''}`}>
        {isEmpty ? 'Not yet recorded' : Array.isArray(value) ? value.join(', ') : value}
      </p>
    </div>
  )
}
