import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
// eslint-disable-next-line no-unused-vars
import { Panel, CareRow, InventoryRow, ActivityItem, TraceabilityLookup } from '../../components/DashboardBits'
// eslint-disable-next-line no-unused-vars
import { IconPaths } from '../../components/icons'
import { useRetailerData } from './components/RetailerDataContext'

export function IncomingBatchesPage() {
  const { incomingBatches, verifyBatch, receiveBatch } = useRetailerData()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: '', packs: '', from: '', cutType: '', counter: '' })
  const [formError, setFormError] = useState('')

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleReceive() {
    const packsNum = Number(form.packs)
    if (!packsNum || packsNum <= 0) {
      setFormError('Enter a valid number of packs.')
      return
    }
    if (!form.from.trim()) {
      setFormError('Enter where the batch is from (e.g. a distributor ID).')
      return
    }
    if (!form.cutType.trim()) {
      setFormError('Enter the beef cut type for the batch.')
      return
    }
    if (form.id.trim() && incomingBatches.some((batch) => batch.id === form.id.trim())) {
      setFormError('A batch with that ID already exists.')
      return
    }
    receiveBatch({
      id: form.id.trim() || undefined,
      packs: packsNum,
      from: form.from.trim(),
      cutType: form.cutType.trim(),
      counter: form.counter.trim() || 'Display counter A',
    })
    setForm({ id: '', packs: '', from: '', cutType: '', counter: '' })
    setFormError('')
    setShowForm(false)
  }

  return (
    <>
      <Panel
        title="Receive a batch"
        action={
          <a className="link" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Cancel' : '+ Receive batch'}
          </a>
        }
      >
        {!showForm && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-600)', margin: 0 }}>
            Click "+ Receive batch" to log a new incoming batch for verification.
          </p>
        )}
        {showForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
            <FormField label="Batch / Lot ID (optional — auto-generated if left blank)" placeholder="e.g. LOT-000091" value={form.id} onChange={(value) => updateField('id', value)} />
            <FormField label="Beef cut type" placeholder="e.g. T-Bone cuts" value={form.cutType} onChange={(value) => updateField('cutType', value)} />
            <FormField label="Packs" type="number" placeholder="e.g. 20" value={form.packs} onChange={(value) => updateField('packs', value)} />
            <FormField label="From (distributor ID)" placeholder="e.g. DT-000015" value={form.from} onChange={(value) => updateField('from', value)} />
            <FormField label="Shelf counter (optional)" placeholder="e.g. Display counter A" value={form.counter} onChange={(value) => updateField('counter', value)} />
            {formError && <p style={{ fontSize: 12.5, color: 'var(--danger, #c0392b)', margin: 0 }}>{formError}</p>}
            <button className="btn btn-primary" onClick={handleReceive} style={{ alignSelf: 'flex-start' }}>
              Add batch
            </button>
          </div>
        )}
      </Panel>

      <Panel title="Incoming batches">
        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 12px' }}>
          Click a pending batch to verify it. Verified batches are added to the shelf inventory automatically.
        </p>
        {incomingBatches.length === 0 && <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>No incoming batches right now.</p>}
        {incomingBatches.map((batch) => (
          <CareRow
            key={batch.id}
            id={batch.id}
            type={`${batch.packs} packs · ${batch.cutType || 'Beef cuts'} · From ${batch.from}`}
            due={batch.status === 'verified' ? 'Verified and shelved' : 'Awaiting verification'}
            status={batch.status === 'verified' ? 'ok' : 'soon'}
            label={batch.status === 'verified' ? 'Verified' : 'Needs check'}
            onClick={batch.status === 'verified' ? undefined : () => verifyBatch(batch.id)}
          />
        ))}
      </Panel>
    </>
  )
}

const thStyle = {
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  color: 'var(--ink-600)',
  padding: '10px 12px',
  borderBottom: '1.5px solid var(--border-soft)',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '10px 12px',
  fontSize: 13.5,
  color: 'var(--ink-900)',
  borderBottom: '1px solid var(--border-soft)',
  verticalAlign: 'middle',
}

function groupByCut(inventory) {
  const groups = []
  const indexByName = new Map()

  inventory.forEach((item) => {
    if (indexByName.has(item.name)) {
      groups[indexByName.get(item.name)].items.push(item)
    } else {
      indexByName.set(item.name, groups.length)
      groups.push({ name: item.name, items: [item] })
    }
  })

  return groups
}

export function InventoryPage() {
  const { inventory, sellItem } = useRetailerData()
  const [qtyById, setQtyById] = useState({})

  return (
    <Panel title="Shelf inventory">
      {inventory.length === 0 && <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>Nothing on the shelf yet.</p>}
      {inventory.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Cuts</th>
                <th style={thStyle}>Lot</th>
                <th style={thStyle}>Quantity</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Sell</th>
              </tr>
            </thead>
            <tbody>
              {groupByCut(inventory).map((group) =>
                group.items.map((item, rowIndex) => (
                  <tr key={item.id}>
                    {rowIndex === 0 && (
                      <td style={{ ...tdStyle, fontWeight: 600 }} rowSpan={group.items.length}>
                        {group.name}
                      </td>
                    )}
                    <td style={tdStyle}>{item.lotId || item.counter || '—'}</td>
                    <td style={tdStyle}>{item.packs} packs</td>
                    <td style={tdStyle}>{item.dateReceived || item.date || '—'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          min="0"
                          max={item.packs}
                          placeholder="Qty"
                          value={qtyById[item.id] ?? ''}
                          onChange={(event) => setQtyById((prev) => ({ ...prev, [item.id]: event.target.value }))}
                          style={{
                            width: 60,
                            padding: '6px 8px',
                            borderRadius: 8,
                            border: '1.5px solid var(--border-soft)',
                            background: 'var(--page-bg)',
                            color: 'var(--ink-900)',
                          }}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            const qty = Number(qtyById[item.id]) || 0
                            if (qty > 0) {
                              sellItem(item.id, qty)
                              setQtyById((prev) => ({ ...prev, [item.id]: '' }))
                            }
                          }}
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

export function VerifyProductPage() {
  const { incomingBatches, verifyBatch, addScanNotification } = useRetailerData()
  const pending = incomingBatches.filter((batch) => batch.status === 'pending')

  const [lookupId, setLookupId] = useState('')
  const [lookupResult, setLookupResult] = useState(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  function handleVerifySubmit(idOverride) {
    const trimmed = (idOverride ?? lookupId).trim()
    if (!trimmed) return

    const batch = incomingBatches.find((entry) => entry.id.toLowerCase() === trimmed.toLowerCase())
    if (!batch) {
      setLookupResult({ status: 'not-found', id: trimmed })
      return
    }
    if (batch.status === 'verified') {
      setLookupResult({ status: 'already-verified', id: batch.id })
      return
    }

    verifyBatch(batch.id)
    addScanNotification(batch.id, batch.packs)
    setLookupResult({ status: 'verified', id: batch.id })
    setLookupId('')
  }

  function handleScanSuccess(decodedText) {
    setLookupId(decodedText)
    setScannerOpen(false)
    handleVerifySubmit(decodedText)
  }

  return (
    <>
      <Panel title="Verify with QR / RFID">
        <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '0 0 12px' }}>
          Scan a batch QR code or enter the lot ID manually to verify it against the shared retailer record.
        </p>
        <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={() => setScannerOpen((value) => !value)}>
          {scannerOpen ? 'Close scanner' : 'Open QR / RFID scanner'}
        </button>
        {scannerOpen && <QrScannerPanel onScan={handleScanSuccess} onCancel={() => setScannerOpen(false)} />}
        <TraceabilityLookup
          placeholder="e.g. LOT-000084"
          helper="Enter a batch/lot ID to verify it manually."
          buttonLabel="Verify batch"
          value={lookupId}
          onChange={(value) => {
            setLookupId(value)
            setLookupResult(null)
          }}
          onSubmit={() => handleVerifySubmit()}
        />
        {lookupResult?.status === 'verified' && <p style={{ fontSize: 13, color: 'var(--success, #1a7f37)', marginTop: 10 }}>{lookupResult.id} verified successfully.</p>}
        {lookupResult?.status === 'already-verified' && <p style={{ fontSize: 13, color: 'var(--ink-600)', marginTop: 10 }}>{lookupResult.id} was already verified.</p>}
        {lookupResult?.status === 'not-found' && <p style={{ fontSize: 13, color: 'var(--danger, #c0392b)', marginTop: 10 }}>No incoming batch found with ID "{lookupResult.id}".</p>}
      </Panel>
      <Panel title="Pending verification">
        {pending.length === 0 && <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>Nothing pending — all caught up.</p>}
        {pending.map((batch) => (
          <CareRow
            key={batch.id}
            id={batch.id}
            type={`${batch.packs} packs · ${batch.cutType || 'Beef cuts'} · From ${batch.from}`}
            due="Awaiting verification"
            status="soon"
            label="Verify now"
            onClick={() => handleVerifySubmit(batch.id)}
          />
        ))}
      </Panel>
    </>
  )
}

export function SalesPage() {
  const { sales, stats } = useRetailerData()

  return (
    <Panel title={`Sales — ${stats.unitsSoldToday} units sold today`}>
      {sales.length === 0 && <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>No sales recorded yet.</p>}
      {sales.map((sale) => (
        <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13.5 }}>
          <span>{sale.item}</span>
          <span>{sale.packs} packs</span>
          <span style={{ color: 'var(--ink-600)' }}>{sale.time}</span>
        </div>
      ))}
    </Panel>
  )
}

export function NotificationsPage() {
  const { notifications } = useRetailerData()
  const customerScans = notifications.filter((note) => note.type === 'scan')
  const verifiedBatches = notifications.filter((note) => note.type === 'verified')

  return (
    <>
      <Panel title="Customer scans">
        {customerScans.length === 0 && <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>No customer scans yet.</p>}
        {customerScans.map((note) => (
          <ActivityItem key={note.id} text={note.text} time={note.time} />
        ))}
      </Panel>

      <Panel title="Retailer verified batches">
        {verifiedBatches.length === 0 && <p style={{ fontSize: 13.5, color: 'var(--ink-600)' }}>No verified-batch updates yet.</p>}
        {verifiedBatches.map((note) => (
          <ActivityItem key={note.id} text={note.text} time={note.time} />
        ))}
      </Panel>
    </>
  )
}

function FormField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, color: 'var(--ink-600)' }}>
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{
          padding: '9px 12px',
          borderRadius: 8,
          border: '1.5px solid var(--border-soft)',
          background: 'var(--page-bg)',
          color: 'var(--ink-900)',
          fontSize: 13.5,
        }}
      />
    </label>
  )
}

function QrScannerPanel({ onScan, onCancel }) {
  const scannerRef = useRef(null)
  const [status, setStatus] = useState('Starting camera...')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    let scanner

    async function startScanner() {
      if (!scannerRef.current) return
      try {
        scanner = new Html5Qrcode(scannerRef.current)
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } }, (decodedText) => {
          if (!cancelled) {
            onScan(decodedText)
          }
        })
        if (!cancelled) {
          setStatus('Scanning... hold the code steady.')
        }
      } catch {
        if (!cancelled) {
          setErrorMessage('Camera access is unavailable. You can still enter the batch ID manually.')
          setStatus('Unavailable')
        }
      }
    }

    startScanner()

    return () => {
      cancelled = true
      if (scanner) {
        scanner.stop().catch(() => undefined)
      }
    }
  }, [onScan])

  return (
    <div style={{ border: '1px solid var(--border-soft)', borderRadius: 12, padding: 12, marginBottom: 12, background: 'var(--panel-bg, #fff)' }}>
      <div ref={scannerRef} style={{ width: '100%', minHeight: 220, borderRadius: 10, overflow: 'hidden', background: 'var(--page-bg)' }} />
      <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: '8px 0 0' }}>{status}</p>
      {errorMessage && <p style={{ fontSize: 12.5, color: 'var(--danger, #c0392b)', margin: '6px 0 0' }}>{errorMessage}</p>}
      <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={onCancel}>Stop scanner</button>
    </div>
  )
}
