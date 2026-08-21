import { useNavigate } from "react-router-dom";
import { DashHead } from "../../../components/DashHead";
import {
  Panel,
  CareRow,
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../../components/DashboardBits";
import { IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useTransporter";
import { getTransportMovements } from "../services/transporterApi";

const statusMeta = {
  overdue: { status: "overdue", label: "Running late" },
  assigned: { status: "soon", label: "Awaiting pickup" },
  accepted: { status: "soon", label: "Accepted" },
  in_transit: { status: "ok", label: "In transit" },
  issue: { status: "overdue", label: "Issue reported" },
};

export function AssignedDeliveries() {
  const navigate = useNavigate();
  const {
    data: deliveries,
    loading,
    error,
    reload,
  } = useAsync(getTransportMovements, []);

  return (
    <>
      <DashHead
        title="Assigned Deliveries"
        subtitle="Pickups that haven't been delivered yet."
      />

      <Panel>
        {loading && <LoadingState label="Loading assigned deliveries…" />}
        {!loading && error && (
          <ErrorState
            message="Couldn't load your deliveries."
            onRetry={reload}
          />
        )}
        {!loading && !error && deliveries?.length === 0 && (
          <EmptyState
            icon={IconPaths.truck}
            title="No deliveries assigned"
            subtitle="New pickups will show up here as soon as they're assigned to you."
          />
        )}
        {!loading &&
          !error &&
          deliveries?.map((d) => {
            const meta = statusMeta[d.status] || {
              status: "soon",
              label: d.status,
            };
            return (
              <CareRow
                key={d.id}
                id={d.id}
                type={`${d.pickup} → ${d.destination}`}
                due={d.scheduledAt || d.createdAt}
                status={meta.status}
                label={meta.label}
                onClick={() =>
                  navigate(`/dashboard/transporter/deliveries/${d.id}`)
                }
              />
            );
          })}
      </Panel>
    </>
  );
}
