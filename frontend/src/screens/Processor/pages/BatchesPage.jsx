import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { Panel } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useProcessorData } from '../context/useProcessorData'

const STAGE_META = {
  packaging: { label: 'Packaging', action: 'Continue' },
  'needs-qr': { label: 'Needs QR', action: 'Generate' },
  ready: { label: 'Ready', action: 'Dispatch' },
}

const STAGE_FILTERS = ['All', 'Packaging', 'Needs QR', 'Ready']

/**
 * Full "Active production batches" page — reached via "View all" on the
 * dashboard's BatchTable preview. Shows every batch with its creation date,
 * plus search, stage filtering, newest/oldest sort, and the same per-row
 * lifecycle actions BatchTable offers on the dashboard.
 */
export function BatchesPageContent() {
  const { batches, generateQR } = useProcessorData()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')

  const handleAction = (batch) => {
    if (batch.stage === 'needs-qr') {
      generateQR(batch.id)
      return
    }
    if (batch.stage === 'ready') {
      // TODO: wire to dispatch/hand-off flow once it exists
      return
    }
    // 'packaging' stage's "Continue" action opens the packaging queue view;
    // no state change needed here since PackagingQueue.jsx owns progress.
  }

  const filteredBatches = useMemo(() => {
    const term = search.trim().toLowerCase()

    let result = batches.filter((b) => {
      const matchesSearch =
        !term ||
        b.id.toLowerCase().includes(term) ||
        b.product.toLowerCase().includes(term) ||
        b.category.toLowerCase().includes(term)

      const matchesStage =
        stageFilter === 'All' ||
        (STAGE_META[b.stage]?.label || b.stage) === stageFilter

      return matchesSearch && matchesStage
    })

    // batches are prepended on creation (newest first) by context, so the
    // array's natural order already is "newest first" — reverse for oldest.
    if (sortOrder === 'oldest') {
      result = [...result].reverse()
    }

    return result
  }, [batches, search, stageFilter, sortOrder])

  return (
    <>
      <DashHead
        greeting="Production batches"
        title=""
        subtitle="Every batch created, with product, category, and creation date."
        actions={
          <>
            <input
              type="text"
              className="bp-search"
              placeholder="Search batch, product, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-outline" onClick={() => navigate('/dashboard/processor')}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.grid}</Icon>Back to dashboard
            </button>
          </>
        }
      />

      <div className="bp-filter-row">
        {STAGE_FILTERS.map((option) => (
          <button
            key={option}
            className={`btn ${stageFilter === option ? 'btn-primary' : 'btn-outline'} bp-filter-btn`}
            onClick={() => setStageFilter(option)}
          >
            {option}
          </button>
        ))}

        <div className="bp-filter-spacer" />

        <button
          className="btn btn-outline bp-filter-btn"
          onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
        >
          <Icon size={14} style={{ marginRight: 4 }}>{IconPaths.sort ?? IconPaths.route}</Icon>
          {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      <Panel title={`Batches (${filteredBatches.length} of ${batches.length})`}>
        {batches.length === 0 ? (
          <p className="empty-state">No batches created yet.</p>
        ) : filteredBatches.length === 0 ? (
          <p className="empty-state">No batches match your search or filter.</p>
        ) : (
          <table className="pq-table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Product</th>
                <th>Category</th>
                <th>Weight</th>
                <th>Packages</th>
                <th>Stage</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((b) => {
                const meta = STAGE_META[b.stage] || { label: b.stage, action: 'View' }
                return (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.product}</td>
                    <td>{b.category}</td>
                    <td>{b.weightKg} kg</td>
                    <td>{b.packages}</td>
                    <td>
                      <span className={`pq-status pq-status-${b.stage}`}>{meta.label}</span>
                    </td>
                    <td>
                      {b.createdDate ? `${b.createdDate} · ${b.createdAt}` : b.createdAt || '—'}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => handleAction(b)}>
                        {meta.action}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Panel>

      <style>{`
        .bp-search {
          --bp-border: var(--border-color, #dfe4ea);
          --bp-surface: var(--surface-color, #ffffff);
          --bp-text: var(--text-color, #1f2933);
          font-size: 0.9rem;
          padding: 8px 12px;
          border: 1px solid var(--bp-border);
          border-radius: 8px;
          background: var(--bp-surface);
          color: var(--bp-text);
          min-width: 220px;
        }

        .bp-filter-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin: 16px 0;
        }

        .bp-filter-btn {
          font-size: 0.82rem;
          padding: 6px 14px;
          white-space: nowrap;
        }

        .bp-filter-spacer {
          flex: 1;
        }

        @media (max-width: 700px) {
          .bp-filter-spacer {
            flex-basis: 100%;
            height: 0;
          }
        }
      `}</style>
    </>
  )
}