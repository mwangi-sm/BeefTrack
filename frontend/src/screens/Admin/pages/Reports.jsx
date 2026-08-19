import { useState } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useAdmin";
import { fetchReportCatalog, runReport, reportDownloadUrl } from "../services/adminApi";

const CATEGORY_ICONS = {
  animal: IconPaths.animal,
  farm: IconPaths.farm,
  health: IconPaths.health,
  veterinary: IconPaths.syringe,
  transport: IconPaths.truck,
  slaughter: IconPaths.abattoir,
  processing: IconPaths.cut,
  distribution: IconPaths.warehouse,
  retail: IconPaths.storefront,
  admin: IconPaths.gear,
};

function iconFor(category) {
  return CATEGORY_ICONS[category] || IconPaths.document;
}

export function Reports() {
  const { data: catalog, loading: catalogLoading, error: catalogError, reload: reloadCatalog } =
    useAsync(fetchReportCatalog, []);

  const [activeReport, setActiveReport] = useState(null); // {id, title}
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [runState, setRunState] = useState("idle"); // idle | loading | ready | error
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState("");

  async function handleRun(report, filters) {
    setActiveReport(report);
    setRunState("loading");
    setRunError("");
    setRunResult(null);
    try {
      const result = await runReport(report.id, filters);
      setRunResult(result);
      setRunState("ready");
    } catch (err) {
      setRunError(err.message || "Couldn't generate this report.");
      setRunState("error");
    }
  }

  function handleSelectReport(report) {
    handleRun(report, { from: dateFrom || undefined, to: dateTo || undefined });
  }

  function handleApplyDates() {
    if (activeReport) {
      handleRun(activeReport, { from: dateFrom || undefined, to: dateTo || undefined });
    }
  }

  return (
    <>
      <DashHead
        greeting="Admin control panel"
        title="Reports"
        subtitle="Generate operational and traceability reports across the platform."
      />

      <Panel title="Report catalog">
        {catalogLoading && <LoadingState label="Loading report catalog" />}
        {!catalogLoading && catalogError && (
          <ErrorState message="Couldn't load the report catalog." onRetry={reloadCatalog} />
        )}
        {!catalogLoading && !catalogError && (!catalog || catalog.length === 0) && (
          <EmptyState icon={IconPaths.sales} title="No reports available yet" />
        )}
        {!catalogLoading && !catalogError && catalog && catalog.length > 0 && (
          <div className="sh-report-grid">
            {catalog.map((report) => (
              <div key={report.id} className="sh-report-card">
                <Icon size={22} style={{ color: "var(--gold-600)" }}>{iconFor(report.category)}</Icon>
                <h4>{report.title}</h4>
                <p>{report.description}</p>
                <button
                  className="btn btn-outline"
                  onClick={() => handleSelectReport(report)}
                  disabled={runState === "loading" && activeReport?.id === report.id}
                >
                  {runState === "loading" && activeReport?.id === report.id ? "Generating…" : "Generate"}
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {activeReport && (
        <Panel
          title={activeReport.title}
          action={
            runState === "ready" && runResult?.rows?.length ? (
              <a
                className="btn btn-outline"
                style={{ fontSize: 12.5, padding: "6px 14px" }}
                href={reportDownloadUrl(activeReport.id, { from: dateFrom || undefined, to: dateTo || undefined })}
              >
                <Icon size={14} style={{ marginRight: 4 }}>{IconPaths.download}</Icon>
                Export CSV
              </a>
            ) : undefined
          }
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 18 }}>
            <div className="field" style={{ minWidth: 160 }}>
              <label>From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="field" style={{ minWidth: 160 }}>
              <label>To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ padding: "10px 18px" }} onClick={handleApplyDates}>
              Apply
            </button>
          </div>

          {runState === "loading" && <LoadingState label={`Generating ${activeReport.title}…`} />}
          {runState === "error" && <ErrorState message={runError} onRetry={handleApplyDates} />}
          {runState === "ready" && (!runResult?.rows || runResult.rows.length === 0) && (
            <EmptyState icon={IconPaths.document} title="No data for this range" />
          )}
          {runState === "ready" && runResult?.rows?.length > 0 && (
            <>
              <div className="sh-report-table">
                <table>
                  <thead>
                    <tr>
                      {runResult.columns.map((col) => (
                        <th key={col.key}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {runResult.rows.map((row, i) => (
                      <tr key={i}>
                        {runResult.columns.map((col) => (
                          <td key={col.key}>{row[col.key] ?? "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {runResult.generatedAt && (
                <p style={{ fontSize: 11.5, color: "var(--ink-600)", marginTop: 12 }}>
                  Generated {new Date(runResult.generatedAt).toLocaleString()}
                </p>
              )}
            </>
          )}
        </Panel>
      )}
    </>
  );
}

export default Reports;