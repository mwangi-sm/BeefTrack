import { useState } from 'react'
import { useProcessorData } from '../context/useProcessorData'

const GRADE_OPTIONS = ['Grade A', 'Grade B', 'Grade C']

/**
 * "Receive Carcass" quick-action form. Opened from QuickActions on the
 * dashboard header; on submit calls receiveCarcass() from context, which
 * adds the carcass to the Incoming Processing Queue with status 'ready'.
 */
export function ReceiveCarcassModal({ isOpen, onClose }) {
  const { receiveCarcass } = useProcessorData()
  const [animalId, setAnimalId] = useState('')
  const [grade, setGrade] = useState(GRADE_OPTIONS[0])
  const [sourceSlaughterHouseId, setSourceSlaughterHouseId] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const resetAndClose = () => {
    setAnimalId('')
    setGrade(GRADE_OPTIONS[0])
    setSourceSlaughterHouseId('')
    setError('')
    onClose()
  }

  const handleSubmit = () => {
    if (!animalId.trim() || !sourceSlaughterHouseId.trim()) {
      setError('Animal ID and source slaughter house are required.')
      return
    }
    receiveCarcass({
      animalId: animalId.trim(),
      grade,
      sourceSlaughterHouseId: sourceSlaughterHouseId.trim(),
    })
    resetAndClose()
  }

  return (
    <div className="pq-modal-overlay" onClick={resetAndClose}>
      <div
        className="pq-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receive-carcass-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pq-modal-header">
          <h3 id="receive-carcass-title">Receive carcass</h3>
          <button className="pq-modal-close" onClick={resetAndClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="pq-modal-body">
          <div className="pq-field">
            <label htmlFor="rc-animal-id">Animal ID</label>
            <input
              id="rc-animal-id"
              type="text"
              value={animalId}
              onChange={(e) => setAnimalId(e.target.value)}
              placeholder="e.g. AN-00451"
            />
          </div>

          <div className="pq-field">
            <label htmlFor="rc-grade">Grade</label>
            <select id="rc-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="pq-field">
            <label htmlFor="rc-source">Source slaughter house ID</label>
            <input
              id="rc-source"
              type="text"
              value={sourceSlaughterHouseId}
              onChange={(e) => setSourceSlaughterHouseId(e.target.value)}
              placeholder="e.g. SH-000012"
            />
          </div>

          {error && <p className="pq-modal-error">{error}</p>}
        </div>

        <div className="pq-modal-actions">
          <button className="btn btn-outline" onClick={resetAndClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Receive carcass
          </button>
        </div>
      </div>
    </div>
  )
}