import { useState } from 'react'
import { useProcessorData } from '../context/useProcessorData'

const PACKAGING_TYPE_OPTIONS = ['Vacuum', 'Shrink Wrap', 'Tray Pack']

/**
 * "Package Products" quick-action form. Lets the user pick one of the
 * batches currently in the 'packaging' stage that isn't already in the
 * packaging queue, assign a packaging type and operator, and adds it to
 * the Packaging Queue via context.
 */
export function PackageProductsModal({ isOpen, onClose }) {
  const { batches, packagingQueue, addToPackagingQueue } = useProcessorData()
  const [batchId, setBatchId] = useState('')
  const [packagingType, setPackagingType] = useState(PACKAGING_TYPE_OPTIONS[0])
  const [operator, setOperator] = useState('')
  const [error, setError] = useState('')

  const queuedBatchIds = new Set(packagingQueue.map((p) => p.batchId))
  const eligibleBatches = batches.filter(
    (b) => b.stage === 'packaging' && !queuedBatchIds.has(b.id)
  )

  if (!isOpen) return null

  const resetAndClose = () => {
    setBatchId('')
    setPackagingType(PACKAGING_TYPE_OPTIONS[0])
    setOperator('')
    setError('')
    onClose()
  }

  const handleSubmit = () => {
    if (!batchId) {
      setError('Select a batch to package.')
      return
    }
    if (!operator.trim()) {
      setError('Operator name is required.')
      return
    }

    addToPackagingQueue({
      batchId,
      packagingType,
      operator: operator.trim(),
    })
    resetAndClose()
  }

  return (
    <div className="pq-modal-overlay" onClick={resetAndClose}>
      <div
        className="pq-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="package-products-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pq-modal-header">
          <h3 id="package-products-title">Package products</h3>
          <button className="pq-modal-close" onClick={resetAndClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="pq-modal-body">
          {eligibleBatches.length === 0 ? (
            <p className="empty-state">
              No batches are ready for packaging right now — create a batch first.
            </p>
          ) : (
            <>
              <div className="pq-field">
                <label htmlFor="pp-batch">Batch</label>
                <select id="pp-batch" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                  <option value="" disabled>
                    Select a batch
                  </option>
                  {eligibleBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} — {b.product} ({b.packages} packs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pq-field">
                <label htmlFor="pp-type">Packaging type</label>
                <select
                  id="pp-type"
                  value={packagingType}
                  onChange={(e) => setPackagingType(e.target.value)}
                >
                  {PACKAGING_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pq-field">
                <label htmlFor="pp-operator">Operator</label>
                <input
                  id="pp-operator"
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="e.g. John"
                />
              </div>
            </>
          )}

          {error && <p className="pq-modal-error">{error}</p>}
        </div>

        <div className="pq-modal-actions">
          <button className="btn btn-outline" onClick={resetAndClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={eligibleBatches.length === 0}
          >
            Start packaging
          </button>
        </div>
      </div>
    </div>
  )
}