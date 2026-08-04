import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { NoteBanner, Panel } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useDistributorData } from '../context/useDistributorData'

const createEmptyForm = (defaultCut) => ({
  deliveryId: '',
  packs: '',
  to: '',
  date: '',
  time: '',
  cutType: defaultCut,
})

function toIsoDate(value) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const yyyy = parsed.getFullYear()
  const mm = String(parsed.getMonth() + 1).padStart(2, '0')
  const dd = String(parsed.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function ScheduleDeliveryFlow({ incomingBatch }) {
  const { scheduleDelivery, cutTypes } = useDistributorData()
  const [stage, setStage] = useState('form')
  const defaultCut = cutTypes[0] || ''
  const [form, setForm] = useState(() => ({
    ...createEmptyForm(defaultCut),
    packs: incomingBatch?.packs != null && incomingBatch.packs !== '' ? String(incomingBatch.packs) : '',
    date: toIsoDate(incomingBatch?.date),
    cutType: incomingBatch?.cutType && cutTypes.includes(incomingBatch.cutType) ? incomingBatch.cutType : defaultCut,
  }))

  const locked = stage !== 'form'

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleFinish = (e) => {
    e.preventDefault()
    setStage('confirm')
  }

  const handleNo = () => {
    setStage('form')
  }

  const handleYes = () => {
    scheduleDelivery({
      id: form.deliveryId,
      packs: Number(form.packs) || 0,
      to: form.to,
      date: form.date,
      time: form.time,
      cutType: form.cutType,
    })
    setStage('scheduled')
  }

  const handleScheduleAnother = () => {
    setForm(createEmptyForm(defaultCut))
    setStage('form')
  }

  return (
    <div className="sd-flow">
      {incomingBatch && !locked && (
        <NoteBanner>
          Pre-filled from warehouse dispatch: <b>{incomingBatch.cutType}</b>
          {' '}· Batch <b>{incomingBatch.batchId}</b>
          {incomingBatch.bay && incomingBatch.bay !== '—' ? <> · {incomingBatch.bay}</> : null}
        </NoteBanner>
      )}

      <form onSubmit={handleFinish} className="sd-form">
        <div className="sd-field">
          <label htmlFor="sd-deliveryId">Delivery ID</label>
          <input
            id="sd-deliveryId"
            type="text"
            value={form.deliveryId}
            onChange={handleChange('deliveryId')}
            placeholder="e.g. DEL-000213"
            disabled={locked}
            required
          />
        </div>

        <div className="sd-field">
          <label htmlFor="sd-cutType">Cut</label>
          <select
            id="sd-cutType"
            value={form.cutType}
            onChange={handleChange('cutType')}
            disabled={locked}
            required
          >
            {cutTypes.map((cut) => (
              <option key={cut} value={cut}>{cut}</option>
            ))}
          </select>
        </div>

        <div className="sd-field">
          <label htmlFor="sd-packs">Packs</label>
          <input
            id="sd-packs"
            type="number"
            min="1"
            value={form.packs}
            onChange={handleChange('packs')}
            placeholder="e.g. 20"
            disabled={locked}
            required
          />
        </div>

        <div className="sd-field sd-field-wide">
          <label htmlFor="sd-to">To</label>
          <input
            id="sd-to"
            type="text"
            value={form.to}
            onChange={handleChange('to')}
            placeholder="e.g. Greenview Butchery (RT-000019)"
            disabled={locked}
            required
          />
        </div>

        <div className="sd-field">
          <label htmlFor="sd-date">Date</label>
          <input
            id="sd-date"
            type="date"
            value={form.date}
            onChange={handleChange('date')}
            disabled={locked}
            required
          />
        </div>

        <div className="sd-field">
          <label htmlFor="sd-time">Time</label>
          <input
            id="sd-time"
            type="time"
            value={form.time}
            onChange={handleChange('time')}
            disabled={locked}
            required
          />
        </div>

        {!locked && (
          <button type="submit" className="btn btn-primary sd-finish">Finish</button>
        )}
      </form>

      {locked && (
        <div className="sd-step">
          <p className="sd-step-question">Do you want to send message to {form.to}?</p>
          {stage === 'confirm' ? (
            <div className="sd-step-actions">
              <button className="btn btn-primary" onClick={handleYes}>Yes</button>
              <button className="btn btn-outline" onClick={handleNo}>No</button>
            </div>
          ) : (
            <p className="sd-step-answer">Yes</p>
          )}
        </div>
      )}

      {stage === 'scheduled' && (
        <div className="sd-result">
          You have scheduled a delivery.
          <button className="btn btn-outline sd-another" onClick={handleScheduleAnother}>
            Schedule another delivery
          </button>
        </div>
      )}

      <style>{`
        .sd-flow {
          --sd-border: var(--border-color, #dfe4ea);
          --sd-surface: var(--surface-color, #ffffff);
          --sd-surface-muted: var(--surface-muted, #f6f8fa);
          --sd-text: var(--text-color, #1f2933);
          --sd-text-muted: var(--text-muted, #5a6570);
          --sd-accent: var(--accent-color, #1c6f5d);
          --sd-accent-soft: var(--accent-color-soft, #e4f2ee);
          display: flex;
          flex-direction: column;
          gap: 20px;
          color: var(--sd-text);
        }

        .sd-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(160px, 1fr));
          gap: 16px 18px;
          padding: 20px;
          background: var(--sd-surface-muted);
          border: 1px solid var(--sd-border);
          border-radius: 10px;
        }

        .sd-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sd-field-wide {
          grid-column: 1 / -1;
        }

        .sd-field label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--sd-text-muted);
        }

        .sd-field input,
        .sd-field select {
          font-size: 0.95rem;
          padding: 9px 11px;
          border: 1px solid var(--sd-border);
          border-radius: 7px;
          background: var(--sd-surface);
          color: var(--sd-text);
        }

        .sd-field input:focus,
        .sd-field select:focus {
          outline: 2px solid var(--sd-accent);
          outline-offset: 1px;
        }

        .sd-field input:disabled,
        .sd-field select:disabled {
          background: var(--sd-surface-muted);
          color: var(--sd-text-muted);
          border-style: dashed;
          cursor: not-allowed;
        }

        .sd-finish {
          grid-column: 1 / -1;
          justify-self: start;
          margin-top: 4px;
        }

        .sd-step {
          padding: 16px 18px;
          border: 1px solid var(--sd-border);
          border-radius: 10px;
          background: var(--sd-surface);
        }

        .sd-step-question {
          margin: 0 0 12px;
          font-weight: 600;
          font-size: 0.98rem;
        }

        .sd-step-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .sd-step-answer {
          margin: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: var(--sd-text-muted);
        }

        .sd-step-answer::before {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--sd-accent);
        }

        .sd-result {
          padding: 14px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          background: var(--sd-accent-soft);
          color: var(--sd-accent);
          border: 1px solid var(--sd-accent);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .sd-another {
          font-weight: 500;
        }

        [data-theme='dark'] .sd-flow {
          --sd-border: #333d47;
          --sd-surface: #1b222b;
          --sd-surface-muted: #222a34;
          --sd-text: #e7ebef;
          --sd-text-muted: #99a4b0;
          --sd-accent: #4fbf9f;
          --sd-accent-soft: rgba(79, 191, 159, 0.14);
        }

        @media (max-width: 560px) {
          .sd-form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

function DeliveriesTable({ deliveries }) {
  if (deliveries.length === 0) {
    return <p className="sd-empty">No deliveries have been added yet.</p>
  }

  return (
    <div className="sd-table-wrap">
      <table className="sd-table">
        <thead>
          <tr>
            <th>Delivery ID</th>
            <th>Cut</th>
            <th>Packs</th>
            <th>To</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((delivery) => (
            <tr key={delivery.id}>
              <td>{delivery.id}</td>
              <td>{delivery.cutType || '—'}</td>
              <td>{delivery.packs}</td>
              <td>{delivery.to}</td>
              <td>{delivery.date}</td>
              <td>{delivery.time}</td>
              <td>
                <span className={`sd-badge ${delivery.status === 'completed' ? 'sd-badge-complete' : 'sd-badge-transit'}`}>
                  {delivery.status === 'completed' ? 'Delivered' : 'In transit'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ScheduleDeliveryContent() {
  const { deliveries } = useDistributorData()
  const location = useLocation()
  const navigate = useNavigate()
  const incomingBatch = location.state && location.state.batchId ? location.state : null

  return (
    <>
      <DashHead
        greeting="Schedule a delivery"
        title=""
        subtitle="Enter the delivery details below."
        actions={
          <button className="btn btn-outline" onClick={() => navigate('/dashboard/distributor')}>
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.grid}</Icon>Back to dashboard
          </button>
        }
      />

      <Panel title="Schedule a delivery">
        <ScheduleDeliveryFlow incomingBatch={incomingBatch} />
      </Panel>

      <Panel title="Deliveries added">
        <DeliveriesTable deliveries={deliveries} />
      </Panel>

      <style>{`
        .sd-empty {
          color: var(--text-muted, #5a6570);
        }

        .sd-table-wrap {
          overflow-x: auto;
        }

        .sd-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .sd-table th,
        .sd-table td {
          text-align: left;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-color, #dfe4ea);
        }

        .sd-table th {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-muted, #5a6570);
        }

        .sd-table tbody tr:hover {
          background: var(--surface-muted, #f6f8fa);
        }

        .sd-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          border: 1px solid transparent;
        }

        .sd-badge-transit {
          background: var(--accent-color-soft, #e4f2ee);
          color: var(--accent-color, #1c6f5d);
          border-color: var(--accent-color, #1c6f5d);
        }

        .sd-badge-complete {
          background: rgba(90, 101, 112, 0.12);
          color: var(--text-muted, #5a6570);
          border-color: var(--text-muted, #5a6570);
        }

        [data-theme='dark'] .sd-table th,
        [data-theme='dark'] .sd-table td {
          border-bottom-color: #333d47;
        }

        [data-theme='dark'] .sd-table tbody tr:hover {
          background: #222a34;
        }
      `}</style>
    </>
  )
}
