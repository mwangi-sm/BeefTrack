import { Panel } from '../../../components/DashboardBits'
import { useProcessorData } from '../context/useProcessorData'

/**
 * Notifications — reads straight from context, newest first (context
 * already unshifts new notifications onto the front of the array).
 */
export function NotificationPanel() {
  const { notifications } = useProcessorData()

  return (
    <Panel title="Notifications" action={<a href="#" className="link">View all</a>}>
      {notifications.length === 0 ? (
        <p className="empty-state">No notifications yet.</p>
      ) : (
        <ul className="pq-notification-list">
          {notifications.map((n) => (
            <li key={n.id} className={`pq-notification pq-notification-${n.type}`}>
              {n.message}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}