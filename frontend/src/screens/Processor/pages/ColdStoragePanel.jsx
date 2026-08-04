import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

/**
 * Cold Storage — per-room capacity bars (rooms are added dynamically via
 * updateColdStorageRoom, not hardcoded to A/B/C, so this scales to however
 * many rooms a facility actually has).
 */
export function ColdStoragePanel() {
  const { coldStorageRooms } = useProcessorData()

  return (
    <Panel title="Cold storage" action={<a href="#" className="link">View all</a>}>
      {coldStorageRooms.length === 0 ? (
        <p className="empty-state">No cold storage rooms configured yet.</p>
      ) : (
        <div className="pq-coldstorage-list">
          {coldStorageRooms.map((room) => (
            <div className="pq-coldstorage-row" key={room.id}>
              <span className="pq-coldstorage-id">{room.id}</span>
              <div
                className="pq-progress"
                aria-label={`Room ${room.id} at ${room.percentFull}% capacity`}
              >
                <div
                  className={`pq-progress-bar${room.percentFull >= 85 ? ' pq-progress-bar-attn' : ''}`}
                  style={{ width: `${room.percentFull}%` }}
                />
                <span className="pq-progress-label">{room.percentFull}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}