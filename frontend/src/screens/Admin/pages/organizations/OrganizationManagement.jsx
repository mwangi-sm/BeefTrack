import { useState, useEffect } from "react";
import { DashHead } from "../../../../components/DashHead";
import { Panel, LoadingState, ErrorState, EmptyState } from "../../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../../components/icons";
import { useAsync } from "../../services/useAdmin";
import {
  fetchAdminOrganizations,
  updateOrganizationStatus,
  verifyOrganization,
} from "../../services/adminApi";

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "farm", label: "Farm" },
  { value: "slaughterhouse", label: "Slaughterhouse" },
  { value: "processor", label: "Processor" },
  { value: "distributor", label: "Distributor" },
  { value: "retailer", label: "Retailer" },
  { value: "transporter", label: "Transporter" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

function Badge({ tone, children }) {
  const colors = {
    ok: { bg: "var(--sage-50, #eef7ee)", fg: "var(--sage-600, #2f7a3d)" },
    warn: { bg: "rgba(184,135,58,0.14)", fg: "var(--gold-600)" },
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
      {children}
    </span>
  );
}

function statusTone(status) {
  if (status === "active") return "ok";
  if (status === "suspended") return "danger";
  return "warn";
}

/**
 * @param {{
 *   fixedType?: string,        // pre-filter to one org type; hides the Type dropdown
 *   excludeTypes?: string,     // comma-separated types to exclude (client-side); hides the Type dropdown
 *   title?: string,
 *   subtitle?: string,
 * }} props
 */
export function OrganizationManagement({ fixedType, excludeTypes, title, subtitle }) {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState("");

  const showTypeFilter = !fixedType && !excludeTypes;
  const excludeList = excludeTypes ? excludeTypes.split(",") : null;

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data: organizations, loading, error, reload } = useAsync(async () => {
    const results = await fetchAdminOrganizations({
      type: fixedType || type,
      status,
      search: search || undefined,
    });
    if (excludeList) {
      return results.filter((org) => !excludeList.includes(org.type));
    }
    return results;
  }, [fixedType, excludeTypes, type, status, search]);

  async function handleToggleStatus(org) {
    const nextStatus = org.status === "active" ? "suspended" : "active";
    setActionError("");
    setActioningId(org.id);
    try {
      await updateOrganizationStatus(org.id, nextStatus);
      reload();
    } catch (err) {
      setActionError(err.message || "Couldn't update this organization's status.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleVerify(org) {
    setActionError("");
    setActioningId(org.id);
    try {
      await verifyOrganization(org.id);
      reload();
    } catch (err) {
      setActionError(err.message || "Couldn't verify this organization.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <>
      <DashHead
        greeting="Admin control panel"
        title={title || "Organization Management"}
        subtitle={
          subtitle ||
          "Farms, slaughterhouses, processors, distributors, and retailers registered on BeefTrace."
        }
        actions={<button className="btn btn-outline" onClick={reload}>Refresh</button>}
      />

      <Panel title="Filters">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          {showTypeFilter && (
            <div className="field" style={{ minWidth: 180 }}>
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
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
              placeholder="Organization name or location"
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

      <Panel title={title || "All organizations"}>
        {loading && <LoadingState label="Loading organizations" />}
        {!loading && error && <ErrorState message="Couldn't load organizations." onRetry={reload} />}
        {!loading && !error && (!organizations || organizations.length === 0) && (
          <EmptyState icon={IconPaths.warehouse} title="No organizations match these filters" />
        )}
        {!loading && !error && organizations && organizations.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--ink-100, #e7e4df)" }}>
                  <th style={{ padding: "8px 10px" }}>Name</th>
                  <th style={{ padding: "8px 10px" }}>Type</th>
                  <th style={{ padding: "8px 10px" }}>Location</th>
                  <th style={{ padding: "8px 10px" }}>Members</th>
                  <th style={{ padding: "8px 10px" }}>Status</th>
                  <th style={{ padding: "8px 10px" }}>Verified</th>
                  <th style={{ padding: "8px 10px" }}>Registered</th>
                  <th style={{ padding: "8px 10px" }}></th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} style={{ borderBottom: "1px solid var(--ink-50, #f3f2f0)" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{org.name || "—"}</td>
                    <td style={{ padding: "8px 10px", textTransform: "capitalize" }}>
                      {(org.type || "—").replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "8px 10px" }}>{org.location || "—"}</td>
                    <td style={{ padding: "8px 10px" }}>{org.memberCount ?? "—"}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <Badge tone={statusTone(org.status)}>{org.status || "unknown"}</Badge>
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <Badge tone={org.verified ? "ok" : "neutral"}>
                        {org.verified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td style={{ padding: "8px 10px", color: "var(--ink-500)" }}>
                      {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                      {!org.verified && (
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: 12, padding: "5px 10px", marginRight: 6 }}
                          disabled={actioningId === org.id}
                          onClick={() => handleVerify(org)}
                        >
                          {actioningId === org.id ? "Working…" : "Verify"}
                        </button>
                      )}
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: 12, padding: "5px 10px" }}
                        disabled={actioningId === org.id}
                        onClick={() => handleToggleStatus(org)}
                      >
                        {actioningId === org.id
                          ? "Working…"
                          : org.status === "active"
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

export default OrganizationManagement;