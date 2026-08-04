import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../../../components/DashboardShell"
import { IconPaths } from "../../../components/icons"


export function TransporterShell({fullname, onLogout, onToggleTheme, children }) {
  const navigate = useNavigate();

  const navItems = [
      { label: 'Dashboard', icon: IconPaths.grid, path: '/dashboard/transporter' },
      { label: 'Assigned pickups', icon: IconPaths.animal, path: '/dashboard/transporter/deliveries' },
      { label: 'Active trip', icon: IconPaths.truck, path: '/dashboard/transporter/trip' },
      { label: 'Route & GPS log', icon: IconPaths.route, path: '/dashboard/transporter/route' },
      { label: 'Delivery history', icon: IconPaths.sales, path: '/dashboard/transporter/history' },
      { label: 'Traceability lookup', icon: IconPaths.search, path: '/dashboard/transporter/traceability' },
      { label: "Documents", icon: IconPaths.schedule, path: "/dashboard/transporter/documents"},
      { label: 'Notifications', icon: IconPaths.bell, path: '/dashboard/transporter/notifications' },
      { label: 'Settings', icon: IconPaths.gear, path: '/dashboard/transporter/settings' },
  ];

  return (
    <DashboardShell
      roleLabel="TRANSPORTER"
      actorId="TP-000045"
      name={fullname}
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      onNotificationsToggle={() => navigate(`/dashboard/transporter/notifications`)}
      onProfileClick={() => navigate(`/dashboard/transporter/profile`)}
    >
      {children}
    </DashboardShell>
  );
}
