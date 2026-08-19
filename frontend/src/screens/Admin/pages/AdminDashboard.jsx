import { Routes, Route } from "react-router-dom";
import { AdminShell } from "../components/AdminShell";
import { DashboardOverview } from "./DashboardOverview";
import { UserManagement } from "./UserManagement";
import { OrganizationsRoutes } from "./organizations/OrganizationsRoutes";
import { AnimalTraceability } from "./AnimalTraceability";
import { ApprovalCenter } from "./ApprovalCenter";
import { Reports } from "./Reports";
import { AuditLogs } from "./AuditLogs";
import { AdminNotifications } from "./AdminNotifications";
import { Settings } from "./Settings";

export function AdminDashboard({ onToggleTheme }) {
  return (
    <AdminShell onToggleTheme={onToggleTheme}>
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="organizations/*" element={<OrganizationsRoutes />} />
        <Route path="traceability" element={<AnimalTraceability />} />
        <Route path="approvals" element={<ApprovalCenter />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </AdminShell>
  );
}