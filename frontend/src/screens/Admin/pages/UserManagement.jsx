import { useState, useEffect } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useAdmin";
import { fetchAdminUsers, updateUserStatus } from "../services/adminApi";

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "farmer", label: "Farmer" },
  { value: "agent", label: "Agent" },
  { value: "transporter", label: "Transporter" },
  { value: "slaughterhouse", label: "Slaughterhouse" },
  { value: "processor", label: "Processor" },
  { value: "distributor", label: "Distributor" },
  { value: "retailer", label: "Retailer" },
  { value: "consumer", label: "Consumer" },
  { value: "veterinary_officer", label: "Veterinary Officer" },
  { value: "administrator", label: "Administrator" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

function StatusBadge({ status }) {
  const tone = status === "active" ? "ok" : status === "suspended" ? "danger" : "neutral";
  const colors = {
    ok: { bg: "var(--sage-50, #eef7ee)", fg: "var(--sage-600, #2f7a3d)" },
    danger: { bg: "var(--rust-50, #fdeeee)", fg: "var(--rust-600)" },
    neutral: { bg: "var(--ink-50, #f3f2f0)", fg: "var(--ink-600)" },
  }[tone];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: colors.bg,
        color: colors.fg,
        textTransform: "capitalize",
      }}
    >
      {status || "unknown"}
    </span>
  );
}

export function UserManagement() {
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState("");

  // Debounce free-text search so we're not firing a request per keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data: users, loading, error, reload } = useAsync(
    () => fetchAdminUsers({ role, status, search: search || undefined }),
    [role, status, search]
  );

  async function handleToggleStatus(user) {
    const nextStatus = user.accountStatus === "active" ? "suspended" : "active";
    setActionError("");
    setActioningId(user.id);
    try {
      await updateUserStatus(user.id, nextStatus);
      reload();
    } catch (err) {
      setActionError(err.message || "Couldn't update this user's status.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <>
      <DashHead
        greeting="Admin control panel"
        title="User Management"
        subtitle="Every account registered on BeefTrace, across all roles."
        actions={<button className="btn btn-outline" onClick={reload}>Refresh</button>}
      />

      <Panel title="Filters">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label>Search</label>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, email, or phone"
            />
          </div>
        </div>
      </Panel>

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
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon size={15}>{IconPaths.warning}</Icon>
          {actionError}
        </div>
      )}

      <Panel title="All users">
        {loading && <LoadingState label="Loading users" />}
        {!loading && error && <ErrorState message={error.message || "Couldn't load users."} onRetry={reload} />}
        {!loading && !error && (!users || users.length === 0) && (
          <EmptyState icon={IconPaths.profile} title="No users match these filters" />
        )}
        {!loading && !error && users && users.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--ink-100, #e7e4df)" }}>
                  <th style={{ padding: "8px 10px" }}>Name</th>
                  <th style={{ padding: "8px 10px" }}>Contact</th>
                  <th style={{ padding: "8px 10px" }}>Role</th>
                  <th style={{ padding: "8px 10px" }}>Status</th>
                  <th style={{ padding: "8px 10px" }}>Verification</th>
                  <th style={{ padding: "8px 10px" }}>Joined</th>
                  <th style={{ padding: "8px 10px" }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--ink-50, #f3f2f0)" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{user.fullName || "—"}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <div>{user.email || "—"}</div>
                      {user.phone && (
                        <div style={{ color: "var(--ink-500)", fontSize: 12 }}>{user.phone}</div>
                      )}
                    </td>
                    <td style={{ padding: "8px 10px", textTransform: "capitalize" }}>
                      {(user.role || "—").replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <StatusBadge status={user.accountStatus} />
                    </td>
                    <td style={{ padding: "8px 10px", textTransform: "capitalize" }}>
                      {user.verificationStatus || "—"}
                    </td>
                    <td style={{ padding: "8px 10px", color: "var(--ink-500)" }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: 12, padding: "5px 10px" }}
                        disabled={actioningId === user.id}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {actioningId === user.id
                          ? "Updating…"
                          : user.accountStatus === "active"
                          ? "Suspend"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

export default UserManagement;
