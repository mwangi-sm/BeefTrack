import { useMemo } from "react";
import { DashHead } from "../../../components/DashHead";
import { StatCard, Panel, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useAdmin";
import { fetchAdminOverview } from "../services/adminApi";
import { useAdminAuth } from "../context/useAdminAuth";

function value(metric) { return metric?.available ? metric.value : "N/A"; }
function Metrics({ title, items }) { return <Panel title={title}><div className="stat-grid">{items.map((item) => <StatCard key={item.label} icon={item.icon} flagText={item.metric?.available ? "Live" : "Unavailable"} value={value(item.metric)} label={item.label} />)}</div></Panel>; }

export function DashboardOverview() {
  const { admin } = useAdminAuth();
  const { data: overview, loading, error, reload } = useAsync(fetchAdminOverview, []);
  const roleRows = useMemo(() => Object.entries(overview?.usersByRole || {}), [overview]);
  if (loading) return <LoadingState label="Loading platform overview" />;
  if (error) return <ErrorState message="Couldn't load the platform overview." onRetry={reload} />;
  return <>
    <DashHead greeting="Admin control panel" title={`Welcome back${admin?.fullname ? `, ${admin.fullname}` : ""}`} subtitle="Real-time operational data from BeefTrace." actions={<button className="btn btn-outline" onClick={reload}>Refresh</button>} />
    <Metrics title="Users" items={[{label:"Total users",metric:overview.users.total,icon:IconPaths.profile},{label:"Active users",metric:overview.users.active,icon:IconPaths.check},{label:"Suspended users",metric:overview.users.suspended,icon:IconPaths.alert}]} />
    <Metrics title="Organizations" items={[{label:"Organizations",metric:overview.organizations.total,icon:IconPaths.warehouse},{label:"Registered animals",metric:overview.animals,icon:IconPaths.animal},{label:"Transporters",metric:overview.transport.transporters,icon:IconPaths.truck},{label:"Pickup assignments",metric:overview.transport.pickupAssignments,icon:IconPaths.truck}]} />
    <Metrics title="Traceability" items={[{label:"Slaughter records",metric:overview.slaughter,icon:IconPaths.abattoir},{label:"Processing records",metric:overview.processing,icon:IconPaths.cut},{label:"Distributor shipments",metric:overview.distribution.total,icon:IconPaths.warehouse},{label:"Product batches",metric:overview.productBatches,icon:IconPaths.boxes},{label:"Retailers",metric:overview.retail.retailers,icon:IconPaths.storefront},{label:"Retail incoming batches",metric:overview.retail.incomingBatches,icon:IconPaths.boxes},{label:"Consumer QR scans",metric:overview.consumerQrScans,icon:IconPaths.qr}]} />
    <div className="grid-2col"><Panel title="Users by role">{roleRows.length ? roleRows.map(([role,count]) => <p key={role}>{role}: {count}</p>) : <EmptyState icon={IconPaths.profile} title="No user role data yet" />}</Panel><Panel title="Disease summary">{Object.keys(overview.disease.byDisease || {}).length ? Object.entries(overview.disease.byDisease).map(([disease,count]) => <p key={disease}>{disease}: {count}</p>) : <EmptyState icon={IconPaths.health} title="No disease data available yet" />}</Panel></div>
    <div className="grid-2col"><Panel title="Verification">{Object.entries(overview.verification.profilesByStatus || {}).map(([status,count]) => <p key={status}>Profiles {status}: {count}</p>)}</Panel><Panel title="Organization status">{Object.entries(overview.organizations.byStatus || {}).map(([status,count]) => <p key={status}>{status}: {count}</p>)}</Panel></div>
  </>;
}