import { useCallback } from 'react'
import { DashHead } from '../../../components/DashHead'
import { Panel, ActivityItem, LoadingState, ErrorState, EmptyState } from '../../../components/DashboardBits'
import { IconPaths } from '../../../components/icons'
import { useAsync } from '../services/useTransporter'
import { getNotifications, markNotificationRead } from '../services/transporterApi'

export function Notifications() {
  const { data: notifications, loading, error, reload } = useAsync(getNotifications, [])

  const unreadCount = notifications?.filter((n) => n.unread).length ?? 0

  const markAllRead = useCallback(async () => {
    if (!notifications) return
    const unread = notifications.filter((n) => n.unread)
    await Promise.all(unread.map((n) => markNotificationRead(n.id)))
    reload()
  }, [notifications, reload])

  return (
    <>
      <DashHead
        greeting="Inbox"
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        actions={
          unreadCount > 0 && (
            <button className="btn" onClick={markAllRead}>
              Mark all read
            </button>
          )
        }
      />

      <Panel title="Recent">
        {loading && <LoadingState label="Loading notifications…" />}

        {!loading && error && (
          <ErrorState message="Couldn't load notifications." onRetry={reload} />
        )}

        {!loading && !error && notifications?.length === 0 && (
          <EmptyState
            icon={IconPaths.bell}
            title="No notifications yet"
            subtitle="Updates about your deliveries will appear here."
          />
        )}

        {!loading &&
          !error &&
          notifications?.map((n) => (
            <ActivityItem key={n.id} text={n.text} time={n.time} />
          ))}
      </Panel>
    </>
  )
}
