import { useState, useEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { DashHead } from "../../../components/DashHead";
import { Panel, StatCard, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { FormField } from "../components/Formfield";
import { fetchReportTypes, fetchReportData, generateReport } from "../services/slaughterhouseApi";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom range" },
];

// Converts a camelCase key like "tagId" into a display label "Tag ID".
function keyToLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/\bId\b/g, "ID");
}

function ReportCard({ report, onSelect }) {
  return (
    <div className="sh-report-card">
      <Icon size={20} style={{ color: "var(--gold-600)" }}>
        {IconPaths.document}
      </Icon>
      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{report.name}</h4>
      <p>{report.desc}</p>
      <button className="btn btn-primary" onClick={onSelect}>
        Select
      </button>
    </div>
  );
}

function ReportTable({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        icon={IconPaths.document}
        title="No data for this period"
        subtitle="Try adjusting the date range or selecting a different report."
      />
    );
  }

  const keys = Object.keys(rows[0]);

  return (
    <div className="sh-report-table">
      <table>
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key}>{keyToLabel(key)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {keys.map((key) => (
                <td key={key}>
                  {row[key] != null ? String(row[key]) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid stroke="var(--border-soft)" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="var(--ink-600)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--ink-600)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--page-bg)",
            border: "1px solid var(--border-soft)",
            borderRadius: 10,
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || "var(--gold-600)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedReport, setSelectedReport] = useState(null);
  const [period, setPeriod] = useState("daily");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [reportData, setReportData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [exportConfirm, setExportConfirm] = useState("");

  function load() {
    setLoading(true);
    setError(null);
    fetchReportTypes()
      .then((data) => setReports(data))
      .catch(() => setError("load"))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  async function handleGenerate() {
    setGenerating(true);
    setReportData(null);
    setError(null);
    try {
      const range = { period };
      if (period === "custom" && customFrom && customTo) {
        range.from = customFrom;
        range.to = customTo;
      }
      const data = await fetchReportData(selectedReport, range);
      setReportData(data);
    } catch {
      setError("generate");
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport(format) {
    const range = { period };
    if (period === "custom" && customFrom && customTo) {
      range.from = customFrom;
      range.to = customTo;
    }
    await generateReport(selectedReport, format, range);
    setExportConfirm(`${format.toUpperCase()} export ready`);
    setTimeout(() => setExportConfirm(""), 2200);
  }

  function handleBack() {
    setSelectedReport(null);
    setReportData(null);
  }

  const selectedReportObj = reports.find((r) => r.id === selectedReport);

  return (
    <>
      <DashHead
        title="Reports"
        subtitle="Generate and export operational reports for the slaughterhouse."
      />

      {/* ---- Phase 1: Report selection ---- */}
      {!selectedReport && (
        <Panel title="Select a report type">
          {loading && <LoadingState label="Loading report types…" />}
          {error === "load" && (
            <ErrorState message="Couldn't load report types." onRetry={load} />
          )}
          {!loading && !error && reports.length === 0 && (
            <EmptyState
              icon={IconPaths.document}
              title="No reports available"
              subtitle="Report types will appear here once configured."
            />
          )}
          {!loading && !error && reports.length > 0 && (
            <div className="sh-report-grid">
              {reports.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onSelect={() => setSelectedReport(r.id)}
                />
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* ---- Phase 2: Configure + Generate ---- */}
      {selectedReport && !reportData && (
        <Panel title="Configure report">
          <FormField
            label="Report type"
            value={selectedReportObj?.name || selectedReport}
            disabled
          />
          <FormField
            label="Period"
            as="select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FormField>
          {period === "custom" && (
            <>
              <FormField
                label="From"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <FormField
                label="To"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={
                generating ||
                (period === "custom" && (!customFrom || !customTo))
              }
            >
              {generating ? "Generating…" : "Generate report"}
            </button>
            <button className="btn btn-outline" onClick={handleBack}>
              Back
            </button>
          </div>
        </Panel>
      )}

      {/* ---- Phase 3: Report display ---- */}
      {reportData && (
        <>
          <Panel title={reportData.title}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <p style={{ fontSize: 13, color: "var(--ink-600)", margin: 0 }}>
                Period: {reportData.period}
              </p>
              <div
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <button
                  className="btn btn-outline"
                  onClick={() => handleExport("pdf")}
                >
                  <Icon size={14}>{IconPaths.download}</Icon> PDF
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => handleExport("csv")}
                >
                  <Icon size={14}>{IconPaths.download}</Icon> CSV
                </button>
                {exportConfirm && (
                  <span
                    className="sh-report-confirm"
                    style={{
                      fontSize: 12,
                      color: "var(--gold-600)",
                      fontWeight: 600,
                    }}
                  >
                    {exportConfirm}
                  </span>
                )}
              </div>
            </div>

            {/* Summary stat cards */}
            <div className="stat-grid">
              {reportData.summary.map((s) => (
                <StatCard
                  key={s.label}
                  icon={IconPaths.document}
                  value={s.value}
                  label={s.label}
                />
              ))}
            </div>

            {/* Chart */}
            {reportData.chartData && reportData.chartData.length > 0 && (
              <Panel title="Chart" style={{ marginTop: 16 }}>
                <ReportChart data={reportData.chartData} />
              </Panel>
            )}

            {/* Data table */}
            <Panel title="Data" style={{ marginTop: 16 }}>
              <ReportTable rows={reportData.rows} />
            </Panel>
          </Panel>

          <div style={{ marginTop: 16 }}>
            <button className="btn btn-outline" onClick={handleBack}>
              <Icon size={14}>{IconPaths.back}</Icon> Back to report types
            </button>
          </div>
        </>
      )}
    </>
  );
}
