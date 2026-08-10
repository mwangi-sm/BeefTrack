import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DashHead } from "../../../components/DashHead";
import {
  StatCard,
  Panel,
  CareRow,
  ActivityItem,
  DetailRow,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../../components/DashboardBits";
import { IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useAdmin";
import {
  fetchUserSummary,
  fetchTraceabilitySummary,
  fetchDashboardCharts,
  fetchPendingApprovals,
  fetchRecentRegistrations,
  fetchRecentActivity,
  fetchSystemAlerts,
} from "../services/adminApi";
import { useAdminAuth } from "../context/useAdminAuth";

const USER_STAT_DEFS = [
  { key: "totalUsers", label: "Total users", icon: IconPaths.profile },
  { key: "totalFarmers", label: "Farmers", icon: IconPaths.farm },
  { key: "totalSlaughterhouses", label: "Slaughterhouses", icon: IconPaths.abattoir },
  { key: "totalSlaughterhouseOfficers", label: "Slaughterhouse officers", icon: IconPaths.health },
  { key: "totalTransporters", label: "Transporters", icon: IconPaths.truck },
  { key: "totalDistributors", label: "Distributors", icon: IconPaths.warehouse },
  { key: "totalProcessors", label: "Processors", icon: IconPaths.cut },
  { key: "totalRetailers", label: "Retailers", icon: IconPaths.storefront },
];

const TRACE_STAT_DEFS = [
  { key: "animalsRegistered", label: "Animals registered", icon: IconPaths.animal },
  { key: "animalsActive", label: "Animals active", icon: IconPaths.check },
  { key: "animalsTransported", label: "Animals transported", icon: IconPaths.truck },
  { key: "animalsSlaughtered", label: "Animals slaughtered", icon: IconPaths.abattoir },
  { key: "carcassRecords", label: "Carcass records", icon: IconPaths.cut },
  { key: "meatBatches", label: "Meat batches", icon: IconPaths.boxes },
  { key: "completedChains", label: "Completed traceability chains", icon: IconPaths.qr },
];

const PIE_COLORS = [
  "var(--gold-600)",
  "var(--maroon-800)",
  "var(--sage-600)",
  "var(--rust-600)",
  "var(--ink-600)",
  "var(--gold-400)",
];

const ALERT_TONE_MAP = {
  critical: { status: "overdue", label: "Critical" },
  warning: { status: "soon", label: "Warning" },
  info: { status: "ok", label: "Info" },
};

const chartTooltipStyle = {
  background: "var(--page-bg)",
  border: "1px solid var(--border-soft)",
  borderRadius: 10,
  fontSize: 12,
};

function StatGrid({ title, defs, data, loading, error, onRetry }) {
  return (
    <Panel title={title}>
      {loading && <LoadingState label={`Loading ${title.toLowerCase()}…`} />}
      {!loading && error && (
        <ErrorState message={`Couldn't load ${title.toLowerCase()}.`} onRetry={onRetry} />
      )}
      {!loading && !error && (
        <div className="stat-grid">
          {defs.map((d) => (
            <StatCard
              key={d.key}
              icon={d.icon}
              flagText="Live"
              value={data?.[d.key] ?? 0}
              label={d.label}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

export function DashboardOverview() {
  const { admin } = useAdminAuth();

  const { data: userSummary, loading: usersLoading, error: usersError, reload: reloadUsers } =
    useAsync(fetchUserSummary, []);
  const { data: traceSummary, loading: traceLoading, error: traceError, reload: reloadTrace } =
    useAsync(fetchTraceabilitySummary, []);
  const { data: charts, loading: chartsLoading, error: chartsError, reload: reloadCharts } =
    useAsync(fetchDashboardCharts, []);
  const { data: approvals, loading: approvalsLoading, error: approvalsError, reload: reloadApprovals } =
    useAsync(() => fetchPendingApprovals(5), []);
  const { data: registrations, loading: regsLoading, error: regsError, reload: reloadRegs } =
    useAsync(() => fetchRecentRegistrations(5), []);
  const { data: activity, loading: activityLoading, error: activityError, reload: reloadActivity } =
    useAsync(() => fetchRecentActivity(8), []);
  const { data: alerts, loading: alertsLoading, error: alertsError, reload: reloadAlerts } =
    useAsync(() => fetchSystemAlerts(5), []);

  const roleBreakdown = useMemo(() => charts?.roleBreakdown || [], [charts]);

  function handleRefreshAll() {
    reloadUsers();
    reloadTrace();
    reloadCharts();
    reloadApprovals();
    reloadRegs();
    reloadActivity();
    reloadAlerts();
  }

  return (
    <>
      <DashHead
        greeting="Admin control panel"
        title={`Welcome back${admin?.fullname ? `, ${admin.fullname}` : ""}`}
        subtitle="System-wide analytics across every stakeholder in the BeefTrace chain."
        actions={
          <button className="btn btn-outline" onClick={handleRefreshAll}>
            Refresh all
          </button>
        }
      />

      <StatGrid
        title="Platform users"
        defs={USER_STAT_DEFS}
        data={userSummary}
        loading={usersLoading}
        error={usersError}
        onRetry={reloadUsers}
      />
      <StatGrid
        title="Traceability"
        defs={TRACE_STAT_DEFS}
        data={traceSummary}
        loading={traceLoading}
        error={traceError}
        onRetry={reloadTrace}
      />

      <div className="grid-2col">
        <Panel title="Registrations trend">
          {chartsLoading && <LoadingState label="Loading chart data…" />}
          {!chartsLoading && chartsError && (
            <ErrorState message="Couldn't load registration trends." onRetry={reloadCharts} />
          )}
          {!chartsLoading && !chartsError && (!charts?.registrationsTrend || charts.registrationsTrend.length === 0) && (
            <EmptyState icon={IconPaths.sales} title="No registration data yet" />
          )}
          {!chartsLoading && !chartsError && charts?.registrationsTrend?.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.registrationsTrend}>
                <CartesianGrid stroke="var(--border-soft)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--ink-600)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--ink-600)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" fill="var(--gold-600)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Users by role">
          {chartsLoading && <LoadingState label="Loading chart data…" />}
          {!chartsLoading && chartsError && (
            <ErrorState message="Couldn't load role breakdown." onRetry={reloadCharts} />
          )}
          {!chartsLoading && !chartsError && roleBreakdown.length === 0 && (
            <EmptyState icon={IconPaths.profile} title="No role data yet" />
          )}
          {!chartsLoading && !chartsError && roleBreakdown.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={roleBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {roleBreakdown.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11.5 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <div className="grid-2col">
        <div>
          <Panel
            title="Pending approvals"
            action={<Link to="/admin/approvals" className="link">View all</Link>}
          >
            {approvalsLoading && <LoadingState label="Loading approvals…" />}
            {!approvalsLoading && approvalsError && (
              <ErrorState message="Couldn't load pending approvals." onRetry={reloadApprovals} />
            )}
            {!approvalsLoading && !approvalsError && approvals?.length === 0 && (
              <EmptyState
                icon={IconPaths.check}
                title="Nothing waiting on you"
                subtitle="New registrations needing review will show up here."
              />
            )}
            {!approvalsLoading &&
              !approvalsError &&
              approvals?.map((a) => (
                <CareRow
                  key={a.id}
                  id={a.id}
                  type={`${a.name} · ${a.role}`}
                  due={a.submittedAt ? `Submitted ${a.submittedAt}` : a.type}
                  status="soon"
                  label="Pending"
                />
              ))}
          </Panel>

          <Panel title="Recent registrations">
            {regsLoading && <LoadingState label="Loading recent registrations…" />}
            {!regsLoading && regsError && (
              <ErrorState message="Couldn't load recent registrations." onRetry={reloadRegs} />
            )}
            {!regsLoading && !regsError && registrations?.length === 0 && (
              <EmptyState icon={IconPaths.profile} title="No recent registrations" />
            )}
            {!regsLoading &&
              !regsError &&
              registrations?.map((r) => (
                <DetailRow key={r.id} label={`${r.name} — ${r.role}`} value={r.registeredAt} />
              ))}
          </Panel>
        </div>

        <div>
          <Panel title="Recent activity">
            {activityLoading && <LoadingState label="Loading activity…" />}
            {!activityLoading && activityError && (
              <ErrorState message="Couldn't load recent activity." onRetry={reloadActivity} />
            )}
            {!activityLoading && !activityError && activity?.length === 0 && (
              <EmptyState icon={IconPaths.clock} title="No activity yet" />
            )}
            {!activityLoading &&
              !activityError &&
              activity?.map((a) => <ActivityItem key={a.id} text={a.text} time={a.time} />)}
          </Panel>

          <Panel title="System alerts">
            {alertsLoading && <LoadingState label="Loading alerts…" />}
            {!alertsLoading && alertsError && (
              <ErrorState message="Couldn't load system alerts." onRetry={reloadAlerts} />
            )}
            {!alertsLoading && !alertsError && alerts?.length === 0 && (
              <EmptyState
                icon={IconPaths.alert}
                title="No active alerts"
                subtitle="System warnings and failed operations will appear here."
              />
            )}
            {!alertsLoading &&
              !alertsError &&
              alerts?.map((al) => {
                const meta = ALERT_TONE_MAP[al.severity] || ALERT_TONE_MAP.info;
                return (
                  <CareRow
                    key={al.id}
                    id={al.id}
                    type={al.text}
                    due={al.time}
                    status={meta.status}
                    label={meta.label}
                  />
                );
              })}
          </Panel>
        </div>
      </div>
    </>
  );
}
