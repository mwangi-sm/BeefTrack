import { Routes, Route } from "react-router-dom";
import { AdminShell } from "../components/AdminShell";
import { Panel } from "../../../components/DashboardBits";
import { DashboardOverview } from "./DashboardOverview";

// Placeholder for modules planned but not yet built (User Management,
// Organization Management, etc. — see ADMIN_INTEGRATION.md for the plan).
// Swapped out module-by-module as each one is built.
function ComingSoon({ title }) {
  return (
    <Panel title={title}>
      <p style={{ fontSize: 13.5, color: "var(--ink-600)", margin: 0 }}>
        This module is being built next — it isn't wired up yet.
      </p>
    </Panel>
  );
}

export function AdminDashboard({ onToggleTheme }) {
  return (
    <AdminShell onToggleTheme={onToggleTheme}>
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="users" element={<ComingSoon title="User Management" />} />
        <Route path="organizations" element={<ComingSoon title="Organization Management" />} />
        <Route path="slaughterhouses" element={<ComingSoon title="Slaughterhouse Management" />} />
        <Route path="traceability" element={<ComingSoon title="Animal Traceability" />} />
        <Route path="approvals" element={<ComingSoon title="Approval Center" />} />
        <Route path="reports" element={<ComingSoon title="Reports" />} />
        <Route path="audit-logs" element={<ComingSoon title="Audit Logs" />} />
        <Route path="notifications" element={<ComingSoon title="Notifications" />} />
        <Route path="settings" element={<ComingSoon title="Settings" />} />
      </Routes>
    </AdminShell>
  );
}
