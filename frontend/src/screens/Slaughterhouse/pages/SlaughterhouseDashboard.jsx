import { useState, useEffect } from "react";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { SlaughterhouseShell } from "../components/SlaughterhouseShell";
import { DashHead } from "../../../components/DashHead";
import {
  StatCard,
  Panel,
  TraceabilityLookup,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { fetchDashboardSummary, fetchThroughputStats } from "../services/slaughterhouseApi";
import { AnimalReception } from "./AnimalReception";
import { AnimalInspection } from "./AnimalInspection";
import { SlaughterOperations } from "./SlaughterOperations";
import { CarcassManagement } from "./CarcassManagement";
import { CarcassInspection } from "./CarcassInspection";
import { Shipments } from "./Shipments";
import { Traceability } from "./Traceability";
import { Notifications } from "./Notifications";
import { Profile } from "./Profile";

const chartTooltipStyle = {
  background: "var(--page-bg)",
  border: "1px solid var(--border-soft)",
  borderRadius: 10,
  fontSize: 12,
};

function SlaughterhouseHome({ fullname }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [throughput, setThroughput] = useState(null);
  const [status, setStatus] = useState("loading");

  function load() {
    setStatus("loading");
    Promise.all([fetchDashboardSummary(), fetchThroughputStats()])
      .then(([summaryData, throughputData]) => {
        setSummary(summaryData);
        setThroughput(throughputData);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const statusData = summary
    ? [
        { name: "In Reception", value: summary.statusBreakdown.inReception, color: "var(--gold-600)" },
        { name: "In Process", value: summary.statusBreakdown.inProcess, color: "var(--ink-600)" },
        { name: "Completed", value: summary.statusBreakdown.completed, color: "var(--success-600, #3f6b49)" },
        { name: "Rejected", value: summary.statusBreakdown.rejected, color: "var(--rust-600)" },
      ]
    : [];
  const totalStatus = statusData.reduce((sum, d) => sum + d.value, 0);

  return (
    <>
      <DashHead
        greeting={`Good morning, ${fullname}!`}
        title="Dashboard"
        subtitle="Reception, inspection and slaughter floor status at a glance."
        actions={
          <>
            <button className="btn btn-outline" onClick={() => navigate(`/dashboard/slaughterhouse/traceability`)}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.search}</Icon>
              Trace an animal
            </button>
            <button className="btn btn-primary" onClick={() => navigate(`/dashboard/slaughterhouse/reception`)}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.plus}</Icon>
              Receive animal
            </button>
          </>
        }
      />

      {false && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "14px 18px",
          marginBottom: 18,
          borderRadius: 12,
          border: "1.5px solid var(--gold-600)",
          background: "var(--cream-50)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--ink-900)" }}>
            <Icon size={18} color="var(--gold-600)">{IconPaths.check}</Icon>
            <span>Finish setting up your facility — add licences, certifications, and key personnel.</span>
          </div>
          <button
            className="btn btn-primary"
            style={{ fontSize: 12.5, padding: "7px 16px", whiteSpace: "nowrap" }}
            onClick={() => navigate("/dashboard/slaughterhouse/setup")}
          >
            Complete setup
          </button>
        </div>
      )}

      {status === "loading" && <LoadingState label="Loading today's status…" />}
      {status === "error" && <ErrorState message="Couldn't load the dashboard summary." onRetry={load} />}

      {status === "ready" && (
        <>
          <div className="stat-grid">
            <StatCard icon={IconPaths.animal} flagText="Today" value={summary.pendingReception} label="Awaiting reception decision" />
            <StatCard icon={IconPaths.health} flagText="Queue" flagType="attn" value={summary.pendingInspections} label="Pending inspections" />
            <StatCard icon={IconPaths.abattoir} flagText="Today" value={summary.processedToday} label="Animals processed" />
            <StatCard icon={IconPaths.truck} flagText="Ready" value={summary.shipmentsReady} label="Shipments ready to dispatch" />
          </div>

          <div className="grid-2col">
            <div>
              <Panel
                title="Reception queue"
                action={<Link to={`/dashboard/slaughterhouse/reception`} className="link">Open reception</Link>}
              >
                <EmptyState
                  icon={IconPaths.animal}
                  title="No animals waiting"
                  subtitle="Arrivals from transporters will appear here for accept/reject decisions."
                />
              </Panel>

              <Panel
                title="Slaughter floor"
                action={<Link to={`/dashboard/slaughterhouse/slaughter`} className="link">Open slaughter ops</Link>}
              >
                <EmptyState
                  icon={IconPaths.abattoir}
                  title="Nothing in progress"
                  subtitle="Animals cleared by inspection will move here through processing."
                />
              </Panel>
            </div>

            <div>
              <Panel title="Traceability lookup">
                <TraceabilityLookup
                  helper="Search a tag, batch or carcass ID to view its full farm-to-fork chain."
                  placeholder="e.g. TAG-000198"
                  buttonLabel="Trace record"
                />
              </Panel>

              <Panel
                title="Notifications"
                action={<Link to={`/dashboard/slaughterhouse/notifications`} className="link">View all</Link>}
              >
                <EmptyState
                  icon={IconPaths.bell}
                  title="You're all caught up"
                  subtitle="Reception, inspection and shipment alerts will show up here."
                />
              </Panel>
            </div>
          </div>

          <div className="grid-2col">
            <Panel title="Animals processed — last 7 days">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={throughput?.daily || []}>
                  <CartesianGrid stroke="var(--border-soft)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--ink-600)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--ink-600)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="processed" fill="var(--gold-600)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Animals by status">
              {totalStatus > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3}>
                        {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
                    {statusData.map((d) => (
                      <span key={d.name} style={{ fontSize: 11, color: "var(--ink-600)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                        {d.name} · {d.value}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={IconPaths.chartPie}
                  title="No activity yet"
                  subtitle="This chart fills in once animals move through reception, inspection and slaughter."
                />
              )}
            </Panel>
          </div>

          <Panel title="Weekly processed vs. rejected">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={throughput?.weekly || []}>
                <CartesianGrid stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--ink-600)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--ink-600)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="processed" stroke="var(--gold-600)" strokeWidth={2} dot={false} name="Processed" />
                <Line type="monotone" dataKey="rejected" stroke="var(--rust-600)" strokeWidth={2} dot={false} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </>
      )}
    </>
  );
}

export function SlaughterhouseDashboard({ fullname, onLogout, onToggleTheme }) {
  return (
    <SlaughterhouseShell fullname={fullname} onLogout={onLogout} onToggleTheme={onToggleTheme}>
      <Routes>
        <Route index element={<SlaughterhouseHome fullname={fullname} />} />
        <Route path="reception" element={<AnimalReception />} />
        <Route path="inspection" element={<AnimalInspection />} />
        <Route path="slaughter" element={<SlaughterOperations />} />
        <Route path="carcass" element={<CarcassManagement />} />
        <Route path="carcass-inspection" element={<CarcassInspection />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="traceability" element={<Traceability />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </SlaughterhouseShell>
  );
}
