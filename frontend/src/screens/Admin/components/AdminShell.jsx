import { useNavigate, useLocation } from "react-router-dom";
import { DashboardShell } from "../../../components/DashboardShell";
import { IconPaths } from "../../../components/icons";
import { useAdminAuth } from "../context/useAdminAuth";

export function AdminShell({ onToggleTheme, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAdminAuth();

  const navItems = [
    { label: "Dashboard", icon: IconPaths.grid, path: "/admin" },
    { label: "Users", icon: IconPaths.profile, path: "/admin/users" },
    {
      label: "Organizations",
      icon: IconPaths.warehouse,
      path: "/admin/organizations",
      active: location.pathname.startsWith("/admin/organizations"),
    },
    { label: "Traceability", icon: IconPaths.search, path: "/admin/traceability" },
    { label: "Approvals", icon: IconPaths.check, path: "/admin/approvals" },
    { label: "Reports", icon: IconPaths.sales, path: "/admin/reports" },
    { label: "Audit Logs", icon: IconPaths.document, path: "/admin/audit-logs" },
    { label: "Notifications", icon: IconPaths.bell, path: "/admin/notifications" },
    { label: "Settings", icon: IconPaths.gear, path: "/admin/settings" },
  ];

  async function handleLogout() {
    await logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <DashboardShell
      roleLabel="ADMIN"
      actorId={admin?.adminId || "ADM"}
      name={admin?.fullname || admin?.name || "Admin"}
      navItems={navItems}
      onLogout={handleLogout}
      onToggleTheme={onToggleTheme}
      onNotificationsToggle={() => navigate("/admin/notifications")}
      onProfileClick={() => navigate("/admin/settings")}
    >
      {children}
    </DashboardShell>
  );
}