import { Link, Routes, Route, useNavigate } from "react-router-dom";
import { TransporterShell } from "../components/TransporterShell";
import { DashHead } from "../../../components/DashHead";
import {
  StatCard,
  Panel,
  CareRow,
  ActivityItem,
  TraceabilityLookup,
  ProgressBar,
  LoadingState,
} from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useTransporter";
import { getAssignedDeliveries, getActiveTrip, getDeliveryHistory, traceAnimal } from "../services/transporterApi";
import { AssignedDeliveries } from "./AssignedDeliveries";
import { DeliveryDetails } from "./DeliveryDetails";
import { CurrentTrip } from "./CurrentTrip";
import { RouteMap } from "./RouteMap";
import { DeliveryHistory } from "./DeliveryHistory";
import { Notifications } from "./Notifications";
import { Documents } from "./Documents";
import { Profile } from "./Profile";
import { SetupAccount } from "./SetupAccount";

const statusMeta = {
  overdue: { status: "overdue", label: "Running late" },
  assigned: { status: "soon", label: "Awaiting pickup" },
  accepted: { status: "soon", label: "Accepted" },
  in_transit: { status: "ok", label: "In transit" },
  issue: { status: "overdue", label: "Issue reported" },
};

function TransporterHome({ fullname }) {
  const navigate = useNavigate();

  const { data: deliveries, loading: deliveriesLoading } = useAsync(getAssignedDeliveries, []);
  const { data: trip, loading: tripLoading } = useAsync(getActiveTrip, []);
  const { data: history, loading: historyLoading } = useAsync(getDeliveryHistory, []);

  const isLoading = deliveriesLoading || tripLoading || historyLoading;

  const pendingCount = deliveries ? deliveries.filter((d) => d.status !== "in_transit" && d.status !== "delivered").length : 0;
  const completedCount = history ? history.length : 0;
  const hasActiveTrip = trip && trip.status && trip.status !== "delivered";

  return (
    <>
      <DashHead
        greeting={`Good morning, ${fullname}!`}
        title="Dashboard"
        subtitle="Today's pickups, your active trip and where things stand on the road."
        actions={
          <>
            <button
              className="btn btn-outline"
              onClick={() => navigate(`/dashboard/transporter/route`)}
            >
              <Icon size={15} style={{ marginRight: 2 }}>
                {IconPaths.route}
              </Icon>
              Log GPS checkpoint
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/dashboard/transporter/deliveries`)}
            >
              <Icon size={15} style={{ marginRight: 2 }}>
                {IconPaths.plus}
              </Icon>
              Start next pickup
            </button>
          </>
        }
      />

      {isLoading && (
        <Panel>
          <LoadingState label="Loading dashboard…" />
        </Panel>
      )}

      {!isLoading && (
        <>
          <div className="stat-grid">
            <StatCard
              icon={IconPaths.truck}
              flagText="In transit"
              value={hasActiveTrip ? 1 : 0}
              label="Active trip"
            />
            <StatCard
              icon={IconPaths.animal}
              flagText="Awaiting pickup"
              flagType="attn"
              value={pendingCount}
              label="Pending pickups"
            />
            <StatCard
              icon={IconPaths.sales}
              flagText="This month"
              value={completedCount}
              label="Completed deliveries"
            />
            <StatCard
              icon={IconPaths.route}
              flagText="Today"
              value={trip?.distanceRemainingKm ? `${trip.distanceRemainingKm} km` : "—"}
              label="Distance remaining"
            />
          </div>

          <div className="grid-2col">
            <div>
              <Panel
                title="Assigned pickups"
                action={
                  <Link to={`/dashboard/transporter/deliveries`} className="link">
                    View route plan
                  </Link>
                }
              >
                {(!deliveries || deliveries.filter((d) => d.status !== "delivered").length === 0) ? (
                  <p style={{ fontSize: 13, color: "var(--ink-600)", margin: 0 }}>No deliveries assigned.</p>
                ) : (
                  deliveries
                    .filter((d) => d.status !== "delivered")
                    .slice(0, 3)
                    .map((d) => {
                      const meta = statusMeta[d.status] || { status: "soon", label: d.status };
                      return (
                        <CareRow
                          key={d.id}
                          id={d.id}
                          type={`${d.pickup} → ${d.destination}`}
                          due={d.scheduledTime || ""}
                          status={meta.status}
                          label={meta.label}
                          onClick={() => navigate(`/dashboard/transporter/deliveries/${d.id}`)}
                        />
                      );
                    })
                )}
              </Panel>

              <Panel
                title="Recent activity"
                action={
                  <Link to={`/dashboard/transporter/history`} className="link">
                    View all
                  </Link>
                }
              >
                {(!history || history.length === 0) ? (
                  <p style={{ fontSize: 13, color: "var(--ink-600)", margin: 0 }}>No completed deliveries yet.</p>
                ) : (
                  history.slice(0, 3).map((h) => (
                    <ActivityItem
                      key={h.id}
                      text={h.destination ? `Delivered to ${h.destination}` : `Delivery ${h.id}`}
                      time={h.date}
                    />
                  ))
                )}
              </Panel>
            </div>

            <div>
              <Panel
                title={hasActiveTrip ? `Active trip — ${trip.tripId || ""}` : "Active trip"}
                action={
                  hasActiveTrip ? (
                    <Link
                      to={`/dashboard/transporter/trip`}
                      className="status-pill status-ok"
                      style={{ textDecoration: "none" }}
                    >
                      In transit
                    </Link>
                  ) : null
                }
              >
                {hasActiveTrip ? (
                  <>
                    <p style={{ fontSize: 13, color: "var(--ink-600)", margin: "0 0 4px" }}>
                      {trip.pickup} → {trip.destination}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--ink-600)", margin: "0 0 14px" }}>
                      {trip.animal} · ETA {trip.eta} · Vehicle {trip.vehicle}
                    </p>
                    <ProgressBar percent={trip.progressPercent || 0} note={`${trip.progressPercent || 0}% of route covered`} />
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--ink-600)", margin: 0 }}>
                    No trip in progress. Accept a delivery and start a trip to see it here.
                  </p>
                )}
              </Panel>

              <Panel title="Traceability lookup">
                <TraceabilityLookup
                  helper="Scan a tag before loading to confirm you're moving the right animal."
                  placeholder="e.g. BT-000198"
                  buttonLabel="Look up animal"
                  onLookup={traceAnimal}
                />
              </Panel>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function TransporterDashboard({ user, fullname, onLogout, onToggleTheme }) {
  const navigate = useNavigate();

  return (
    <TransporterShell
      fullname={fullname}
      onLogout={onLogout}
      onToggleTheme={onToggleTheme}
    >
      {/* There is no repository-backed setup-completion value, so browser
          storage must not decide whether setup is complete. */}
      {
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "14px 18px",
          marginBottom: 18,
          marginTop: 4,
          borderRadius: 12,
          border: "1.5px solid var(--gold-600)",
          background: "var(--cream-50)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--ink-900)" }}>
            <Icon size={18} color="var(--gold-600)">{IconPaths.check}</Icon>
            <span>Finish setting up your account — upload documents and add your vehicle details.</span>
          </div>
          <button
            className="btn btn-primary"
            style={{ fontSize: 12.5, padding: "7px 16px", whiteSpace: "nowrap" }}
            onClick={() => navigate("/dashboard/transporter/setup")}
          >
            Complete setup
          </button>
        </div>
      }
      <Routes>
        <Route index element={<TransporterHome fullname={fullname} />} />
        <Route path="setup" element={<SetupAccount user={user} />} />
        <Route path="deliveries" element={<AssignedDeliveries />} />
        <Route path="deliveries/:id" element={<DeliveryDetails />} />
        <Route path="trip" element={<CurrentTrip />} />
        <Route path="route" element={<RouteMap />} />
        <Route path="history" element={<DeliveryHistory />} />
        <Route path="documents" element={<Documents user={user} />} />
        <Route
          path="traceability"
          element={
            <TraceabilityLookup
              helper="Scan a tag before loading to confirm you're moving the right animal."
              placeholder="e.g. BT-000198"
              buttonLabel="Look up animal"
              onLookup={traceAnimal}
            />
          }
        />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile user={user} />} />
        <Route
          path="settings"
          element={
            <Panel title="Settings">
              <p style={{ fontSize: 13.5, color: "var(--ink-600)", margin: 0 }}>
                Account and store settings will live here.
              </p>
            </Panel>
          }
        />
      </Routes>
    </TransporterShell>
  );
}
