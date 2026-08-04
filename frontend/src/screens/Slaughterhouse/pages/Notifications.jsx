import { useCallback } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { IconPaths } from "../../../components/icons";
import { useAsync } from "../../Transporter/services/useTransporter";
import { fetchNotifications, markNotificationRead } from "../services/slaughterhouseApi";

export function Notifications() {
  const { data: notifications, loading, error, reload } = useAsync(fetchNotifications, []);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const markRead = useCallback(
    async (id) => {
      await markNotificationRead(id);
      reload();
    },
    [reload],
  );

  const markAllRead = useCallback(async () => {
    if (!notifications) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markNotificationRead(n.id)));
    reload();
  }, [notifications, reload]);

  // While loading after a reload, keep showing the previous data (no flash).
  const showLoading = loading && !notifications;
  const showData = !showLoading && !error && notifications?.length > 0;
  const showEmpty = !showLoading && !error && notifications?.length === 0;

  return (
    <>
      <DashHead
        greeting="Inbox"
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        actions={
          unreadCount > 0 && (
            <button className="btn btn-outline" onClick={markAllRead}>
              Mark all read
            </button>
          )
        }
      />

      <Panel title="Recent">
        {showLoading && <LoadingState label="Loading notifications…" />}

        {!loading && error && <ErrorState message="Couldn't load notifications." onRetry={reload} />}

        {showEmpty && (
          <EmptyState
            icon={IconPaths.bell}
            title="No notifications yet"
            subtitle="Reception, inspection and shipment alerts will show up here."
          />
        )}

        {showData && (
          <div className="sh-notif-list">
            {notifications.map((n) => (
              <div
                className={`sh-notif-item sh-tone-${n.tone} ${n.read ? "sh-read" : ""}`}
                key={n.id}
              >
                <div className="sh-notif-dot" />
                <div className="sh-notif-body">
                  <div className="sh-notif-text">{n.text}</div>
                  <div className="sh-notif-time">{n.time}</div>
                </div>
                {!n.read && (
                  <button
                    className="btn btn-outline"
                    onClick={() => markRead(n.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
