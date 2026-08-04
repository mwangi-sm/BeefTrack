import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { NoteBanner, StatCard, Panel } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useDistributorData } from '../context/useDistributorData'

const LOW_STOCK_THRESHOLD = 50

function extractReceivedDate(id) {
  const match = /-(\d{10,})$/.exec(id)
  if (!match) return null
  const date = new Date(Number(match[1]))
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString()
}

function formatItemDate(isoDate) {
  if (!isoDate) return null
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString()
}

const createEmptyReceiveForm = (defaultCut, defaultBay) => ({ cutType: defaultCut, batchNo: '', bay: defaultBay, packs: '', date: '' })

export function WarehouseInventoryContent() {
  const navigate = useNavigate()
  const {
    warehouseItems,
    totalWarehouseCount,
    pendingShipmentRequests,
    inTransitDeliveries,
    receiveManualShipment,
    storageBays,
    cutTypes,
    updateCutTypes,
  } = useDistributorData()

  const defaultBay = storageBays[0] || 'Bay 1'
  const defaultCut = cutTypes[0] || 'Sirloin'
  const FILTER_OPTIONS = useMemo(() => ['All', ...cutTypes, ...storageBays], [cutTypes, storageBays])

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [receiveForm, setReceiveForm] = useState(() => createEmptyReceiveForm(defaultCut, defaultBay))
  const [expandedBatch, setExpandedBatch] = useState(null)
  const [showManageCutsModal, setShowManageCutsModal] = useState(false)
  const [cutDraft, setCutDraft] = useState(cutTypes)

  const rows = useMemo(() => {
    const inStock = warehouseItems.map((item) => ({
      key: `stock-${item.id}`,
      batchId: item.id,
      cutType: item.name,
      bay: item.sub || 'Unassigned bay',
      packs: item.count,
      date: formatItemDate(item.date) || extractReceivedDate(item.id),
      status: 'In Stock',
    }))
    const awaitingReceipt = pendingShipmentRequests.map((r) => ({
      key: `incoming-${r.id}`,
      batchId: r.id,
      cutType: `Incoming · From ${r.from}`,
      bay: '—',
      packs: r.packs,
      date: r.date,
      status: 'Awaiting Receipt',
    }))
    const inTransit = inTransitDeliveries.map((d) => ({
      key: `transit-${d.id}`,
      batchId: d.id,
      cutType: `Outbound · To ${d.to}`,
      bay: '—',
      packs: d.packs,
      date: d.date,
      status: 'In Transit',
    }))
    return [...inStock, ...awaitingReceipt, ...inTransit]
  }, [warehouseItems, pendingShipmentRequests, inTransitDeliveries])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.batchId.toLowerCase().includes(term) ||
        row.cutType.toLowerCase().includes(term) ||
        row.bay.toLowerCase().includes(term)
      const matchesFilter =
        filter === 'All' ||
        row.cutType.toLowerCase().includes(filter.toLowerCase()) ||
        row.bay.toLowerCase().includes(filter.toLowerCase())
      return matchesSearch && matchesFilter
    })
  }, [rows, search, filter])

  const activeBays = new Set(warehouseItems.map((item) => item.sub).filter(Boolean)).size
  const lowStockCount = warehouseItems.filter((item) => item.count < LOW_STOCK_THRESHOLD).length

  const handleReceiveChange = (field) => (e) => {
    setReceiveForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleReceiveConfirm = (e) => {
    e.preventDefault()
    receiveManualShipment({
      id: receiveForm.batchNo,
      name: receiveForm.cutType,
      bay: receiveForm.bay,
      packs: Number(receiveForm.packs) || 0,
      date: receiveForm.date,
    })
    setReceiveForm(createEmptyReceiveForm(defaultCut, defaultBay))
    setShowReceiveModal(false)
  }

  const openManageCuts = () => {
    setCutDraft(cutTypes)
    setShowManageCutsModal(true)
  }

  const updateCutDraft = (index, value) => {
    setCutDraft((prev) => prev.map((c, i) => (i === index ? value : c)))
  }

  const removeCutDraft = (index) => {
    setCutDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const addCutDraft = () => {
    setCutDraft((prev) => [...prev, `Cut ${prev.length + 1}`])
  }

  const saveCuts = () => {
    const cleaned = cutDraft.map((c) => c.trim()).filter(Boolean)
    updateCutTypes(cleaned)
    if (filter !== 'All' && !cleaned.includes(filter) && !storageBays.includes(filter)) {
      setFilter('All')
    }
    setShowManageCutsModal(false)
  }

  const handleDispatch = (row) => {
    navigate('/dashboard/distributor/schedule-delivery', {
      state: {
        batchId: row.batchId,
        cutType: row.cutType,
        bay: row.bay,
        packs: row.packs,
        date: row.date,
      },
    })
  }

  return (
    <>
      <DashHead
        greeting="Warehouse inventory"
        title=""
        subtitle="Everything currently in cold storage across your warehouse."
        actions={
          <>
            <input
              type="text"
              className="wi-search"
              placeholder="Search batch, cut, or bay…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" onClick={() => setShowReceiveModal(true)}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.plus}</Icon>Add shipment
            </button>
            <button className="btn btn-outline" onClick={openManageCuts}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.gear}</Icon>Manage cuts
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard/distributor')}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.grid}</Icon>Back to dashboard
            </button>
          </>
        }
      />

      {lowStockCount > 0 && (
        <NoteBanner>
          <b>{lowStockCount}</b> item{lowStockCount === 1 ? '' : 's'} {lowStockCount === 1 ? 'is' : 'are'} running low (under {LOW_STOCK_THRESHOLD} packs).
        </NoteBanner>
      )}

      <div className="stat-grid">
        <StatCard icon={IconPaths.boxes} flagText="In stock" value={totalWarehouseCount} label="Total packages in stock" />
        <StatCard icon={IconPaths.warehouse} flagText="Active" value={activeBays} label="Storage bays in use" />
        <StatCard icon={IconPaths.boxes} flagText="Low stock" flagType={lowStockCount > 0 ? 'attn' : undefined} value={lowStockCount} label="Low stock warnings" />
      </div>

      <div className="wi-filter-row">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option}
            className={`btn ${filter === option ? 'btn-primary' : 'btn-outline'} wi-filter-btn`}
            onClick={() => setFilter(option)}
          >
            {option === 'All' ? 'All cuts' : option}
          </button>
        ))}
      </div>

      <Panel title="Batch tracking">
        {filteredRows.length === 0 ? (
          <p className="wi-empty">No batches match your search or filter.</p>
        ) : (
          <div className="wi-table-wrap">
            <table className="wi-table">
              <thead>
                <tr>
                  <th>Cut</th>
                  <th>Batch no</th>
                  <th>Bay</th>
                  <th>Packs</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <>
                    <tr key={row.key}>
                      <td>
                        <span className="wi-cut-name">{row.cutType}</span>
                      </td>
                      <td>
                        <div className="wi-batch-cell">
                          <span className="wi-qr">QR</span>
                          <span className="wi-batch-id">{row.batchId}</span>
                        </div>
                      </td>
                      <td>
                        <span className="wi-bay-tag">{row.bay}</span>
                      </td>
                      <td>{row.packs}</td>
                      <td>{row.date || '—'}</td>
                      <td>
                        <span className={`wi-status wi-status-${row.status.replace(/\s+/g, '-').toLowerCase()}`}>
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <div className="wi-row-actions">
                          <button
                            className="btn btn-outline wi-action-btn"
                            onClick={() => setExpandedBatch(expandedBatch === row.key ? null : row.key)}
                          >
                            Track traceability
                          </button>
                          {row.status === 'In Stock' && (
                            <button
                              className="btn btn-primary wi-action-btn"
                              onClick={() => handleDispatch(row)}
                            >
                              Dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedBatch === row.key && (
                      <tr key={`${row.key}-detail`} className="wi-detail-row">
                        <td colSpan={7}>
                          Traceability: Farmer → Agent → Transporter → Distributor ({row.batchId})
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {showReceiveModal && (
        <div className="wi-modal-backdrop" onClick={() => setShowReceiveModal(false)}>
          <div className="wi-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="wi-modal-title">Receive shipment</h3>
            <form onSubmit={handleReceiveConfirm} className="wi-modal-form">
              <div className="wi-field">
                <label htmlFor="wi-cut-type">Cut</label>
                <select id="wi-cut-type" value={receiveForm.cutType} onChange={handleReceiveChange('cutType')}>
                  {cutTypes.map((cut) => (
                    <option key={cut} value={cut}>{cut}</option>
                  ))}
                </select>
              </div>
              <div className="wi-field">
                <label htmlFor="wi-batch-no">Batch no</label>
                <input
                  id="wi-batch-no"
                  type="text"
                  value={receiveForm.batchNo}
                  onChange={handleReceiveChange('batchNo')}
                  placeholder="e.g. LOT-000102"
                  required
                />
              </div>
              <div className="wi-field">
                <label htmlFor="wi-bay">Bay</label>
                <select id="wi-bay" value={receiveForm.bay} onChange={handleReceiveChange('bay')}>
                  {storageBays.map((bay) => (
                    <option key={bay} value={bay}>{bay}</option>
                  ))}
                </select>
              </div>
              <div className="wi-field">
                <label htmlFor="wi-packs">Packs</label>
                <input
                  id="wi-packs"
                  type="number"
                  min="1"
                  value={receiveForm.packs}
                  onChange={handleReceiveChange('packs')}
                  placeholder="e.g. 24"
                  required
                />
              </div>
              <div className="wi-field">
                <label htmlFor="wi-date">Date</label>
                <input
                  id="wi-date"
                  type="date"
                  value={receiveForm.date}
                  onChange={handleReceiveChange('date')}
                  required
                />
              </div>
              <div className="wi-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowReceiveModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showManageCutsModal && (
        <div className="wi-modal-backdrop" onClick={() => setShowManageCutsModal(false)}>
          <div className="wi-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="wi-modal-title">Manage cuts</h3>
            <div className="wi-modal-form">
              {cutDraft.length === 0 && (
                <p className="wi-empty">No cuts yet — add at least one below.</p>
              )}
              {cutDraft.map((cut, i) => (
                <div key={i} className="wi-cut-row">
                  <input
                    type="text"
                    value={cut}
                    onChange={(e) => updateCutDraft(i, e.target.value)}
                    placeholder={`e.g. Cut ${i + 1}`}
                  />
                  <button
                    type="button"
                    className="wi-cut-remove"
                    onClick={() => removeCutDraft(i)}
                    aria-label="Remove cut"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-outline wi-add-cut" onClick={addCutDraft}>
                <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.plus}</Icon>Add cut
              </button>
            </div>
            <div className="wi-modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowManageCutsModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveCuts}>Save cuts</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .wi-cut-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }

        .wi-cut-row input {
          flex: 1;
          font-size: 0.95rem;
          padding: 9px 11px;
          border: 1px solid var(--wi-border, #dfe4ea);
          border-radius: 7px;
          background: var(--wi-surface, #ffffff);
          color: var(--wi-text, #1f2933);
        }

        .wi-cut-remove {
          background: none;
          border: 1px solid var(--wi-border, #dfe4ea);
          border-radius: 7px;
          width: 34px;
          height: 34px;
          cursor: pointer;
          color: var(--wi-text-muted, #5a6570);
        }

        .wi-add-cut {
          margin-top: 4px;
        }

        [data-theme='dark'] .wi-cut-row input,
        [data-theme='dark'] .wi-cut-remove {
          border-color: #333d47;
          background: #1b222b;
          color: #e7ebef;
        }

        .wi-search {
          --wi-border: var(--border-color, #dfe4ea);
          --wi-surface: var(--surface-color, #ffffff);
          --wi-text: var(--text-color, #1f2933);
          font-size: 0.9rem;
          padding: 8px 12px;
          border: 1px solid var(--wi-border);
          border-radius: 8px;
          background: var(--wi-surface);
          color: var(--wi-text);
          min-width: 200px;
        }

        .wi-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }

        .wi-filter-btn {
          font-size: 0.82rem;
          padding: 6px 14px;
        }

        .wi-empty {
          color: var(--text-muted, #5a6570);
          padding: 10px 0;
        }

        .wi-table-wrap {
          overflow-x: auto;
        }

        .wi-table {
          width: 100%;
          min-width: 640px;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .wi-table th,
        .wi-table td {
          text-align: left;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-color, #dfe4ea);
          vertical-align: middle;
        }

        .wi-table th {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-muted, #5a6570);
        }

        .wi-cut-name {
          font-weight: 500;
        }

        .wi-batch-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .wi-qr {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 5px;
          background: var(--surface-muted, #f6f8fa);
          border: 1px solid var(--border-color, #dfe4ea);
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .wi-batch-id {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }

        .wi-bay-tag {
          font-size: 0.85rem;
          color: var(--text-muted, #5a6570);
        }

        .wi-status {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 600;
          border: 1px solid transparent;
        }

        .wi-status-in-stock {
          background: var(--accent-color-soft, #e4f2ee);
          color: var(--accent-color, #1c6f5d);
          border-color: var(--accent-color, #1c6f5d);
        }

        .wi-status-awaiting-receipt {
          background: rgba(214, 158, 46, 0.14);
          color: #b7791f;
          border-color: #b7791f;
        }

        .wi-status-in-transit {
          background: rgba(49, 130, 206, 0.12);
          color: #2b6cb0;
          border-color: #2b6cb0;
        }

        .wi-row-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .wi-action-btn {
          font-size: 0.78rem;
          padding: 6px 10px;
          white-space: nowrap;
        }

        .wi-detail-row td {
          font-size: 0.85rem;
          color: var(--text-muted, #5a6570);
          background: var(--surface-muted, #f6f8fa);
        }

        .wi-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 20, 25, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 16px;
        }

        .wi-modal {
          --wi-border: var(--border-color, #dfe4ea);
          --wi-surface: var(--surface-color, #ffffff);
          --wi-text: var(--text-color, #1f2933);
          --wi-text-muted: var(--text-muted, #5a6570);
          background: var(--wi-surface);
          border: 1px solid var(--wi-border);
          border-radius: 12px;
          padding: 22px;
          width: 100%;
          max-width: 380px;
          color: var(--wi-text);
        }

        .wi-modal-title {
          margin: 0 0 16px;
          font-size: 1.05rem;
        }

        .wi-modal-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .wi-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .wi-field label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--wi-text-muted);
        }

        .wi-field input,
        .wi-field select {
          font-size: 0.95rem;
          padding: 9px 11px;
          border: 1px solid var(--wi-border);
          border-radius: 7px;
          background: var(--wi-surface);
          color: var(--wi-text);
        }

        .wi-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }

        [data-theme='dark'] .wi-search,
        [data-theme='dark'] .wi-modal {
          --wi-border: #333d47;
          --wi-surface: #1b222b;
          --wi-text: #e7ebef;
          --wi-text-muted: #99a4b0;
        }

        [data-theme='dark'] .wi-table th,
        [data-theme='dark'] .wi-table td {
          border-bottom-color: #333d47;
        }

        [data-theme='dark'] .wi-qr {
          background: #222a34;
          border-color: #333d47;
        }

        [data-theme='dark'] .wi-detail-row td {
          background: #222a34;
        }

        @media (max-width: 600px) {
          .wi-search {
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}
