import { useState } from 'react'
import { useProcessorData } from '../context/useProcessorData'

const CATEGORY_OPTIONS = ['Premium', 'Standard', 'Minced']

/**
 * "Create Batch" quick-action form. On submit calls createBatch() from
 * context, which adds it to Active Production Batches with stage
 * 'packaging'.
 */
export function CreateBatchModal({ isOpen, onClose }) {
  const { createBatch } = useProcessorData()
  const [product, setProduct] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0])
  const [weightKg, setWeightKg] = useState('')
  const [packages, setPackages] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const resetAndClose = () => {
    setProduct('')
    setCategory(CATEGORY_OPTIONS[0])
    setWeightKg('')
    setPackages('')
    setError('')
    onClose()
  }

  const handleSubmit = () => {
    const weightNum = Number(weightKg)
    const packagesNum = Number(packages)

    if (!product.trim()) {
      setError('Product name is required.')
      return
    }
    if (!weightKg || weightNum <= 0) {
      setError('Enter a valid weight in kg.')
      return
    }
    if (!packages || !Number.isInteger(packagesNum) || packagesNum <= 0) {
      setError('Enter a valid number of packages.')
      return
    }

    createBatch({
      product: product.trim(),
      category,
      weightKg: weightNum,
      packages: packagesNum,
    })
    resetAndClose()
  }

  return (
    <div className="pq-modal-overlay" onClick={resetAndClose}>
      <div
        className="pq-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-batch-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pq-modal-header">
          <h3 id="create-batch-title">Create batch</h3>
          <button className="pq-modal-close" onClick={resetAndClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="pq-modal-body">
          <div className="pq-field">
            <label htmlFor="cb-product">Product</label>
            <input
              id="cb-product"
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Sirloin"
            />
          </div>

          <div className="pq-field">
            <label htmlFor="cb-category">Category</label>
            <select id="cb-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="pq-field-row">
            <div className="pq-field">
              <label htmlFor="cb-weight">Weight (kg)</label>
              <input
                id="cb-weight"
                type="number"
                min="0"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 220"
              />
            </div>

            <div className="pq-field">
              <label htmlFor="cb-packages">Packages</label>
              <input
                id="cb-packages"
                type="number"
                min="0"
                step="1"
                value={packages}
                onChange={(e) => setPackages(e.target.value)}
                placeholder="e.g. 24"
              />
            </div>
          </div>

          {error && <p className="pq-modal-error">{error}</p>}
        </div>

        <div className="pq-modal-actions">
          <button className="btn btn-outline" onClick={resetAndClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Create batch
          </button>
        </div>
      </div>
    </div>
  )
}