import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../../../components/DashboardShell";
import { IconPaths } from "../../../components/icons";

export function SlaughterhouseShell({ fullname, onLogout, onToggleTheme, children }) {
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard",icon: IconPaths.grid, path: "/dashboard/slaughterhouse" },
    { label: "Animal Reception", icon: IconPaths.animal, path: "/dashboard/slaughterhouse/reception" },
    { label: "Ante Mortem Inspection", icon: IconPaths.health, path: "/dashboard/slaughterhouse/inspection" },
    { label: "Slaughter Operations", icon: IconPaths.abattoir, path: "/dashboard/slaughterhouse/slaughter" },
    { label: "Post Mortem Inspection", icon: IconPaths.health, path: "/dashboard/slaughterhouse/carcass-inspection" },
    { label: "Carcass Management", icon: IconPaths.cut, path: "/dashboard/slaughterhouse/carcass" },
    { label: "Shipments", icon: IconPaths.truck, path: "/dashboard/slaughterhouse/shipments" },
    { label: "Traceability lookup", icon: IconPaths.search, path: "/dashboard/slaughterhouse/traceability" },
    { label: "Notifications", icon: IconPaths.bell, path: "/dashboard/slaughterhouse/notifications" },
  ];

  return (
    <DashboardShell
      roleLabel="SLAUGHTERHOUSE"
      name={fullname}
      navItems={navItems}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
      onNotificationsToggle={() => navigate(`/dashboard/slaughterhouse/notifications`)}
      onProfileClick={() => navigate(`/dashboard/slaughterhouse/profile`)}
    >
      {children}
    </DashboardShell>
  );
}
