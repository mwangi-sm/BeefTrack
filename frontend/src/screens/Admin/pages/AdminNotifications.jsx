import { useState } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, LoadingState, ErrorState, EmptyState, NotificationItem } from "../../../components/DashboardBits";
import { IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useAdmin";
import {
  fetchAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/adminApi";

function fmt(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleString();
}

export function AdminNotifications() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [actionError, setActionError] = useState("");

  const { data: notifications, loading, error, reload } = useAsync(
    () => fetchAdminNotifications({ unreadOnly }),
    [unreadOnly]
  );

  const unreadCount = notifications?.filter((n) => n.unread).length ?? 0;

  async function handleItemClick(notification) {
    if (!notification.unread) return;
    try {
      await markNotificationRead(notification.id);
      reload();
    } catch (err) {
      setActionError(err.message || "Couldn't mark that notification as read.");
    }
  }

  async function handleMarkAllRead() {
    setActionError("");
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      reload();
    } catch (err) {
      setActionError(err.message || "Couldn't mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <>
      <DashHead
        greeting="Admin control panel"
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.` : "You're all caught up."}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => setUnreadOnly((v) => !v)}>
              {unreadOnly ? "Show all" : "Unread only"}
            </button>
            <button className="btn btn-outline" onClick={handleMarkAllRead} disabled={markingAll || unreadCount === 0}>
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          </>
        }
      />

      {actionError && (
        <div
          style={{
            background: "var(--rust-50, #fdeeee)",
            border: "1px solid var(--rust-600)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "var(--rust-600)",
          }}
        >
          {actionError}
        </div>
      )}

      <Panel title="All notifications">
        {loading && <LoadingState label="Loading notifications" />}
        {!loading && error && <ErrorState message="Couldn't load notifications." onRetry={reload} />}
        {!loading && !error && (!notifications || notifications.length === 0) && (
          <EmptyState
            icon={IconPaths.bell}
            title={unreadOnly ? "No unread notifications" : "No notifications yet"}
          />
        )}
        {!loading && !error && notifications && notifications.length > 0 && (
          <div>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                style={{ cursor: n.unread ? "pointer" : "default" }}
              >
                <NotificationItem
                  type={n.type}
                  text={n.text}
                  time={fmt(n.createdAt)}
                  unread={n.unread}
                />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

export default AdminNotifications;