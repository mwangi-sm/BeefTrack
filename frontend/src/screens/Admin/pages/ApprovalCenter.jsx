import { useState, useEffect } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useAdmin";
import { fetchAdminApprovals, approveRequest, rejectRequest } from "../services/adminApi";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

const ENTITY_OPTIONS = [
  { value: "", label: "All entity types" },
  { value: "organization", label: "Organizations" },
  { value: "profile", label: "Profiles" },
];

function Badge({ tone, children }) {
  const colors = {
    ok: { bg: "var(--sage-50, #eef7ee)", fg: "var(--sage-600, #2f7a3d)" },
    warn: { bg: "rgba(184,135,58,0.14)", fg: "var(--gold-600)" },
    danger: { bg: "var(--rust-50, #fdeeee)", fg: "var(--rust-600)" },
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
  if (status === "approved") return "ok";
  if (status === "rejected") return "danger";
  return "warn";
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleString();
}

export function ApprovalCenter() {
  const [status, setStatus] = useState("pending");
  const [entityType, setEntityType] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: approvals, loading, error, reload } = useAsync(
    () => fetchAdminApprovals({ status, entityType }),
    [status, entityType]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRejectingId(null);
    setRejectReason("");
  }, [status, entityType]);

  async function handleApprove(item) {
    setActionError("");
    setActioningId(item.id);
    try {
      await approveRequest(item.id);
      reload();
    } catch (err) {
      setActionError(err.message || "Couldn't approve this request.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleConfirmReject(item) {
    setActionError("");
    setActioningId(item.id);
    try {
      await rejectRequest(item.id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason("");
      reload();
    } catch (err) {
      setActionError(err.message || "Couldn't reject this request.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <>
      <DashHead
        greeting="Admin control panel"
        title="Approval Center"
        subtitle="Review pending organization and profile registrations."
        actions={<button className="btn btn-outline" onClick={reload}>Refresh</button>}
      />

      <Panel title="Filters">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Entity type</label>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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

      <Panel title="Requests">
        {loading && <LoadingState label="Loading approval requests" />}
        {!loading && error && <ErrorState message="Couldn't load approval requests." onRetry={reload} />}
        {!loading && !error && (!approvals || approvals.length === 0) && (
          <EmptyState icon={IconPaths.check} title="Nothing to review" subtitle="No requests match these filters." />
        )}
        {!loading && !error && approvals && approvals.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {approvals.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1.5px solid var(--border-soft)",
                  borderRadius: 12,
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name || "Unnamed"}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-600)", marginTop: 2, textTransform: "capitalize" }}>
                      {item.entityType} · {(item.role || item.stakeholderType || "—").replace(/_/g, " ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "var(--ink-600)", marginTop: 8 }}>
                  Submitted {fmt(item.submittedAt)}
                  {item.reviewedAt && (
                    <> · Reviewed {fmt(item.reviewedAt)}{item.reviewedBy ? ` by ${item.reviewedBy}` : ""}</>
                  )}
                </div>

                {item.status === "pending" && (
                  <div style={{ marginTop: 12 }}>
                    {rejectingId === item.id ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection (optional)"
                          style={{
                            flex: 1,
                            minWidth: 200,
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1.5px solid var(--border-soft)",
                            background: "var(--page-bg)",
                            color: "var(--ink-900)",
                            fontSize: 13,
                          }}
                        />
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: 12, padding: "7px 14px" }}
                          disabled={actioningId === item.id}
                          onClick={() => handleConfirmReject(item)}
                        >
                          {actioningId === item.id ? "Rejecting…" : "Confirm reject"}
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: 12, padding: "7px 14px" }}
                          disabled={actioningId === item.id}
                          onClick={() => { setRejectingId(null); setRejectReason(""); }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: 12, padding: "7px 14px" }}
                          disabled={actioningId === item.id}
                          onClick={() => handleApprove(item)}
                        >
                          {actioningId === item.id ? "Approving…" : "Approve"}
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: 12, padding: "7px 14px" }}
                          disabled={actioningId === item.id}
                          onClick={() => setRejectingId(item.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

export default ApprovalCenter;