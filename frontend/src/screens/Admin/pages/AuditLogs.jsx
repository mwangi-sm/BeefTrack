import { useState, useEffect } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useAdmin";
import { fetchAuditLogs } from "../services/adminApi";

const PAGE_SIZE = 25;

function fmt(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleString();
}

export function AuditLogs() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Any filter change resets pagination back to page 1.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, dateFrom, dateTo]);

  const { data, loading, error, reload } = useAsync(
    () =>
      fetchAuditLogs({
        search: search || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [search, dateFrom, dateTo, page]
  );

  const totalPages = data?.total ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <DashHead
        greeting="Admin control panel"
        title="Audit Logs"
        subtitle="A record of administrative actions taken across the platform."
        actions={<button className="btn btn-outline" onClick={reload}>Refresh</button>}
      />

      <Panel title="Filters">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label>Search</label>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Actor name or activity text"
            />
          </div>
          <div className="field" style={{ minWidth: 160 }}>
            <label>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="field" style={{ minWidth: 160 }}>
            <label>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </Panel>

      <Panel title="Activity">
        {loading && <LoadingState label="Loading audit logs" />}
        {!loading && error && <ErrorState message="Couldn't load audit logs." onRetry={reload} />}
        {!loading && !error && (!data?.items || data.items.length === 0) && (
          <EmptyState icon={IconPaths.document} title="No activity matches these filters" />
        )}
        {!loading && !error && data?.items && data.items.length > 0 && (
          <>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {data.items.map((entry) => (
                <div key={entry.id} className="activity-item">
                  <span className="activity-dot"></span>
                  <div>
                    <div className="activity-text">
                      <b>{entry.actor || "Unknown actor"}</b>
                      {entry.actorRole ? ` (${entry.actorRole.replace(/_/g, " ")})` : ""}
                      {" — "}
                      {entry.activity}
                    </div>
                    <div className="activity-time">{fmt(entry.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 12.5, padding: "6px 14px" }}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: 12.5, color: "var(--ink-600)", display: "flex", alignItems: "center" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 12.5, padding: "6px 14px" }}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Panel>
    </>
  );
}

export default AuditLogs;