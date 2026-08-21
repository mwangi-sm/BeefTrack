import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashHead } from '../../../components/DashHead'
import { Panel } from '../../../components/DashboardBits'
import { Icon, IconPaths } from '../../../components/icons'
import { useProcessorData } from '../context/useProcessorData'

const TYPE_LABELS = { carcass: 'Carcass', cut: 'Cut', package: 'Package' };

const FILTERS = ['All', 'Carcasses', 'Cuts', 'Packaged', 'Completed', 'Delivered'];

// "Carcasses"/"Cuts"/"Packaged" filter by item type; "Completed"/"Delivered"
// filter by status, since those are terminal states that could apply to any
// type once QR generation and dispatch flows exist (see TODOs below).
function matchesFilter(item, filter) {
  switch (filter) {
    case 'Carcasses': return item.itemType === 'carcass'
    case 'Cuts': return item.itemType === 'cut'
    case 'Packaged': return item.itemType === 'package'
    case 'Completed': return item.status === 'Completed'
    case 'Delivered': return item.status === 'Delivered'
    default: return true
  }
}

// Renders the varying `details` shape per item type into one readable line.
function renderDetails(item) {
  if (item.itemType === 'carcass' || item.itemType === 'cut') {
    return `Animal ID: ${item.details?.animalId || '—'} · Grade: ${item.details?.grade || '—'}`
  }
  if (item.itemType === 'package') {
    return `Packaging: ${item.details?.packagingType || '—'} · Operator: ${item.details?.operator || '—'}`
  }
  return '—'
}

/**
 * Cold Storage page — every carcass sent here from Processing queue, every
 * cut completed in "In processing", and every package completed in
 * "In packaging", in one table with type/status filtering.
 *
 * TODO: 'Pending QR' and 'Delivered' statuses aren't set by anything yet —
 * they'll need to be wired once QR generation and a dispatch/delivery flow
 * exist (updateColdStorageItemStatus is already in context, ready for that).
 */
export function ColdStoragePageContent() {
  const { coldStorageItems } = useProcessorData()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return coldStorageItems.filter((item) => {
      const matchesSearch =
        !term ||
        item.id.toLowerCase().includes(term) ||
        item.sourceId.toLowerCase().includes(term)
      return matchesSearch && matchesFilter(item, filter)
    })
  }, [coldStorageItems, search, filter])

  return (
    <>
      <DashHead
        greeting="Cold storage"
        title=""
        subtitle="Every carcass, cut, and package currently in cold storage."
        actions={
          <>
            <input
              type="text"
              className="cs-search"
              placeholder="Search by ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-outline" onClick={() => navigate('/dashboard/processor')}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.grid}</Icon>Back to dashboard
            </button>
          </>
        }
      />

      <div className="cs-filter-row">
        {FILTERS.map((option) => (
          <button
            key={option}
            className={`btn ${filter === option ? 'btn-primary' : 'btn-outline'} cs-filter-btn`}
            onClick={() => setFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <Panel title={`Cold storage items (${filteredItems.length} of ${coldStorageItems.length})`}>
        {coldStorageItems.length === 0 ? (
          <p className="empty-state">No items in cold storage yet.</p>
        ) : filteredItems.length === 0 ? (
          <p className="empty-state">No items match your search or filter.</p>
        ) : (
          <table className="pq-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Source</th>
                <th>Details</th>
                <th>Date added</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{TYPE_LABELS[item.itemType] || item.itemType}</td>
                  <td>{item.sourceId}</td>
                  <td>{renderDetails(item)}</td>
                  <td>{item.dateAdded} · {item.addedAt}</td>
                  <td>
                    <span className={`pq-status pq-status-${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <style>{`
        .cs-search {
          --cs-border: var(--border-color, #dfe4ea);
          --cs-surface: var(--surface-color, #ffffff);
          --cs-text: var(--text-color, #1f2933);
          font-size: 0.9rem;
          padding: 8px 12px;
          border: 1px solid var(--cs-border);
          border-radius: 8px;
          background: var(--cs-surface);
          color: var(--cs-text);
          min-width: 200px;
        }

        .cs-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }

        .cs-filter-btn {
          font-size: 0.82rem;
          padding: 6px 14px;
        }

        .pq-status-pending-approval {
          background: var(--warning-color-soft, #fdf3d8);
          color: var(--warning-color, #a66a00);
          border-color: var(--warning-color, #a66a00);
        }

        .pq-status-packaged {
          background: rgba(49, 130, 206, 0.12);
          color: #2b6cb0;
          border-color: #2b6cb0;
        }

        .pq-status-processed,
        .pq-status-completed {
          background: var(--accent-color-soft, #e4f2ee);
          color: var(--accent-color, #1c6f5d);
          border-color: var(--accent-color, #1c6f5d);
        }

        .pq-status-pending-qr {
          background: var(--danger-color-soft, #fbe9e3);
          color: var(--danger-color, #b3401f);
          border-color: var(--danger-color, #b3401f);
        }

        .pq-status-delivered {
          background: rgba(120, 90, 200, 0.12);
          color: #6b46c1;
          border-color: #6b46c1;
        }

        [data-theme='dark'] .pq-status-pending-approval {
          background: rgba(224, 168, 47, 0.14);
          color: #e0a82f;
          border-color: #e0a82f;
        }

        [data-theme='dark'] .pq-status-packaged {
          background: rgba(79, 158, 224, 0.14);
          color: #6bb2f0;
          border-color: #6bb2f0;
        }

        [data-theme='dark'] .pq-status-processed,
        [data-theme='dark'] .pq-status-completed {
          background: rgba(79, 191, 159, 0.14);
          color: #4fbf9f;
          border-color: #4fbf9f;
        }

        [data-theme='dark'] .pq-status-pending-qr {
          background: rgba(226, 112, 79, 0.14);
          color: #e2704f;
          border-color: #e2704f;
        }

        [data-theme='dark'] .pq-status-delivered {
          background: rgba(159, 122, 234, 0.14);
          color: #9f7aea;
          border-color: #9f7aea;
        }
      `}</style>
    </>
  )
}