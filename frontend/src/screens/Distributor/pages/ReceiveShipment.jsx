import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { NoteBanner, Panel } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useDistributorData } from '../context/useDistributorData'
import { formatDueLabel } from '../context/distributorDataUtils'

const SHIPMENT_HISTORY_ANCHOR = 'shipment-history-table'

function ShipmentRequestCard({ shipment }) {
  const { acceptShipment, declineShipment } = useDistributorData()
  const [stage, setStage] = useState(
    shipment.status === 'accepted' ? 'accepted' : shipment.status === 'declined' ? 'declined' : 'question'
  )

  const showAreYouSureAfterYes = stage === 'confirmYes' || stage === 'accepted'
  const showAreYouSureAfterNo = stage === 'confirmNo' || stage === 'declined'

  return (
    <div className="rs-flow">
      <div className="rs-detail-form" role="group" aria-label="Shipment details">
        <div className="rs-field">
          <label>Shipment ID</label>
          <input type="text" value={shipment.id} readOnly />
        </div>
        <div className="rs-field">
          <label>Packs</label>
          <input type="text" value={shipment.packs} readOnly />
        </div>
        <div className="rs-field">
          <label>Date</label>
          <input type="text" value={shipment.date} readOnly />
        </div>
        <div className="rs-field">
          <label>Time</label>
          <input type="text" value={shipment.time} readOnly />
        </div>
      </div>

      <div className="rs-step">
        <p className="rs-step-question">Do you want to receive shipment?</p>
        {stage === 'question' ? (
          <div className="rs-step-actions">
            <button className="btn btn-primary" onClick={() => setStage('confirmYes')}>Yes</button>
            <button className="btn btn-outline" onClick={() => setStage('confirmNo')}>No</button>
          </div>
        ) : (
          <p className="rs-step-answer">{showAreYouSureAfterYes ? 'Yes' : 'No'}</p>
        )}
      </div>

      {showAreYouSureAfterYes && (
        <div className="rs-step">
          <p className="rs-step-question">Are you sure?</p>
          {stage === 'confirmYes' ? (
            <div className="rs-step-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  acceptShipment(shipment.id)
                  setStage('accepted')
                }}
              >
                Yes
              </button>
              <button className="btn btn-outline" onClick={() => setStage('question')}>Cancel</button>
            </div>
          ) : (
            <p className="rs-step-answer">Yes</p>
          )}
        </div>
      )}

      {showAreYouSureAfterNo && (
        <div className="rs-step">
          <p className="rs-step-question">Are you sure?</p>
          {stage === 'confirmNo' ? (
            <div className="rs-step-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  declineShipment(shipment.id)
                  setStage('declined')
                }}
              >
                I don't want to receive shipment
              </button>
              <button className="btn btn-outline" onClick={() => setStage('question')}>Cancel</button>
            </div>
          ) : (
            <p className="rs-step-answer">I don't want to receive shipment</p>
          )}
        </div>
      )}

      {stage === 'accepted' && (
        <div className="rs-result rs-result-accept">You have agreed to receive shipment.</div>
      )}

      {stage === 'declined' && (
        <div className="rs-result rs-result-decline">You have canceled this request.</div>
      )}
    </div>
  )
}

function ShipmentHistoryTable({ shipments }) {
  const resolved = shipments.filter((s) => s.status === 'accepted' || s.status === 'declined')

  if (resolved.length === 0) {
    return <p className="rs-empty">No shipments have been added or canceled yet.</p>
  }

  return (
    <div className="rs-table-wrap">
      <table className="rs-table">
        <thead>
          <tr>
            <th>Shipment ID</th>
            <th>Packs</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {resolved.map((shipment) => (
            <tr key={shipment.id}>
              <td>{shipment.id}</td>
              <td>{shipment.packs}</td>
              <td>{shipment.date}</td>
              <td>{shipment.time}</td>
              <td>
                <span className={`rs-badge ${shipment.status === 'accepted' ? 'rs-badge-accept' : 'rs-badge-decline'}`}>
                  {shipment.status === 'accepted' ? 'Added' : 'Canceled'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ReceiveShipmentContent() {
  const { shipmentRequests, pendingShipmentRequests } = useDistributorData()
  const location = useLocation()
  const navigate = useNavigate()
  const historyRef = useRef(null)

  useEffect(() => {
    if (location.hash === `#${SHIPMENT_HISTORY_ANCHOR}` && historyRef.current) {
      historyRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <>
      <DashHead
        greeting="Receive shipment"
        title=""
        subtitle="Confirm an incoming shipment into the warehouse."
        actions={
          <button className="btn btn-outline" onClick={() => navigate('/dashboard/distributor')}>
            <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.grid}</Icon>Back to dashboard
          </button>
        }
      />

      <NoteBanner>
        You have <b>{pendingShipmentRequests.length}</b> shipment request{pendingShipmentRequests.length === 1 ? '' : 's'}.
      </NoteBanner>

      {shipmentRequests.length === 0 ? (
        <Panel title="Shipment details">
          <p className="rs-empty">No shipment requests right now.</p>
        </Panel>
      ) : (
        shipmentRequests.map((shipment) => (
          <Panel key={shipment.id} title={`Shipment ${shipment.id} — ${formatDueLabel(shipment.date, shipment.time)}`}>
            <ShipmentRequestCard shipment={shipment} />
          </Panel>
        ))
      )}

      <div id={SHIPMENT_HISTORY_ANCHOR} ref={historyRef}>
        <Panel title="Shipments added / canceled">
          <ShipmentHistoryTable shipments={shipmentRequests} />
        </Panel>
      </div>

      <style>{`
        .rs-flow {
          --rs-border: var(--border-color, #dfe4ea);
          --rs-surface: var(--surface-color, #ffffff);
          --rs-surface-muted: var(--surface-muted, #f6f8fa);
          --rs-text: var(--text-color, #1f2933);
          --rs-text-muted: var(--text-muted, #5a6570);
          --rs-accent: var(--accent-color, #1c6f5d);
          --rs-accent-soft: var(--accent-color-soft, #e4f2ee);
          --rs-danger: var(--danger-color, #b3401f);
          --rs-danger-soft: var(--danger-color-soft, #fbe9e3);
          display: flex;
          flex-direction: column;
          gap: 20px;
          color: var(--rs-text);
        }

        .rs-detail-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(160px, 1fr));
          gap: 14px 18px;
          padding: 18px;
          background: var(--rs-surface-muted);
          border: 1px solid var(--rs-border);
          border-radius: 10px;
        }

        .rs-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rs-field label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--rs-text-muted);
        }

        .rs-field input {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 0.95rem;
          padding: 9px 11px;
          border: 1px solid var(--rs-border);
          border-radius: 7px;
          background: var(--rs-surface);
          color: var(--rs-text);
        }

        .rs-field input:focus {
          outline: 2px solid var(--rs-accent);
          outline-offset: 1px;
        }

        .rs-step {
          padding: 16px 18px;
          border: 1px solid var(--rs-border);
          border-radius: 10px;
          background: var(--rs-surface);
        }

        .rs-step-question {
          margin: 0 0 12px;
          font-weight: 600;
          font-size: 0.98rem;
        }

        .rs-step-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .rs-step-answer {
          margin: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: var(--rs-text-muted);
        }

        .rs-step-answer::before {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--rs-accent);
        }

        .rs-result {
          padding: 14px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          border: 1px solid transparent;
        }

        .rs-result-accept {
          background: var(--rs-accent-soft);
          color: var(--rs-accent);
          border-color: var(--rs-accent);
        }

        .rs-result-decline {
          background: var(--rs-danger-soft);
          color: var(--rs-danger);
          border-color: var(--rs-danger);
        }

        .rs-empty {
          color: var(--text-muted, #5a6570);
        }

        .rs-table-wrap {
          overflow-x: auto;
        }

        .rs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .rs-table th,
        .rs-table td {
          text-align: left;
          padding: 10px 12px;
          border-bottom: 1px solid var(--rs-border, #dfe4ea);
        }

        .rs-table th {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--rs-text-muted, #5a6570);
        }

        .rs-table tbody tr:hover {
          background: var(--rs-surface-muted, #f6f8fa);
        }

        .rs-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          border: 1px solid transparent;
        }

        .rs-badge-accept {
          background: var(--rs-accent-soft, #e4f2ee);
          color: var(--rs-accent, #1c6f5d);
          border-color: var(--rs-accent, #1c6f5d);
        }

        .rs-badge-decline {
          background: var(--rs-danger-soft, #fbe9e3);
          color: var(--rs-danger, #b3401f);
          border-color: var(--rs-danger, #b3401f);
        }

        [data-theme='dark'] .rs-flow {
          --rs-border: #333d47;
          --rs-surface: #1b222b;
          --rs-surface-muted: #222a34;
          --rs-text: #e7ebef;
          --rs-text-muted: #99a4b0;
          --rs-accent: #4fbf9f;
          --rs-accent-soft: rgba(79, 191, 159, 0.14);
          --rs-danger: #e2704f;
          --rs-danger-soft: rgba(226, 112, 79, 0.14);
        }

        @media (max-width: 560px) {
          .rs-detail-form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}
