import { useState } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, DetailRow, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { traceRecord } from "../services/slaughterhouseApi";

export function Traceability() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [result, setResult] = useState(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setStatus("loading");
    try {
      const data = await traceRecord(query.trim());
      setResult(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <DashHead
        title="Traceability"
        subtitle="Search a tag, batch or carcass ID to view its full farm-to-fork chain."
      />

      <Panel title="Search">
        <div className="field" style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. TAG-000198, batch or carcass ID"
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: 10,
              border: "1.5px solid var(--border-soft)",
              background: "var(--page-bg)",
              color: "var(--ink-900)",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13.5,
            }}
          />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSearch}>
          <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.search}</Icon>
          Trace record
        </button>
      </Panel>

      {status === "loading" && <LoadingState label="Tracing record…" />}
      {status === "error" && <ErrorState message="Couldn't complete the trace." onRetry={handleSearch} />}
      {status === "ready" && !result && (
        <EmptyState
          icon={IconPaths.search}
          title="No record found"
          subtitle={`Nothing matched "${query}". Check the tag, batch or carcass ID and try again.`}
        />
      )}
      {status === "ready" && result && (
        <Panel title={`Chain of custody — ${result.animal?.tagId || query}`}>
          <DetailRow label="Farmer" value={result.reception?.farmer} />
          <DetailRow label="Reception status" value={result.reception?.status} />
          <DetailRow label="Ante-mortem outcome" value={result.anteMortemInspections?.[0]?.outcome} />
          <DetailRow label="Slaughter stage" value={result.slaughterOperations?.[0]?.stage} />
          <DetailRow label="Carcass" value={result.carcasses?.[0]?.id} />
          <DetailRow label="Carcass inspection" value={result.carcassInspections?.[0]?.outcome} />
          <DetailRow label="Destination" value={result.shipments?.[0]?.destination} />
        </Panel>
      )}
    </>
  );
}
