import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashHead } from "../../../components/DashHead";
import {
  Panel,
  DetailRow,
  LoadingState,
  ErrorState,
} from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { useAsync } from "../services/useTransporter";
import {
  getDeliveryById,
  acceptDelivery,
  startTrip,
  reportIssue,
} from "../services/transporterApi";

export function DeliveryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: delivery,
    loading,
    error,
    reload,
  } = useAsync(() => getDeliveryById(id), [id]);
  const [busy, setBusy] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueNote, setIssueNote] = useState("");

  async function handleAccept() {
    setBusy(true);
    try {
      await acceptDelivery(id);
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleStartTrip() {
    setBusy(true);
    try {
      await startTrip(id);
      navigate(`/dashboard/transporter/trip`);
    } finally {
      setBusy(false);
    }
  }

  async function handleReportIssue() {
    setBusy(true);
    try {
      await reportIssue(id, issueNote);
      setIssueOpen(false);
      setIssueNote("");
      reload();
    } finally {
      setBusy(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid var(--border-soft)",
    background: "var(--page-bg)",
    color: "var(--ink-900)",
    fontFamily: "inherit",
    fontSize: 13.5,
    marginBottom: 12,
    resize: "vertical",
  };

  return (
    <>
      <DashHead title={id} subtitle="Shipment details" />

      {loading && (
        <Panel>
          <LoadingState label="Loading shipment…" />
        </Panel>
      )}
      {!loading && error && (
        <Panel>
          <ErrorState message="Couldn't load this shipment." onRetry={reload} />
        </Panel>
      )}

      {!loading && !error && delivery && (
        <div className="grid-2col">
          <div>
            <Panel title="Shipment details">
              <DetailRow label="Assignment ID" value={delivery.id} />
              <DetailRow label="Trip ID" value={delivery.tripId || 'Not started'} />
              <DetailRow label="Assigned at" value={delivery.assignedAt} />
              <DetailRow label="Pickup time" value={delivery.pickupTime || 'Not scheduled'} />
            </Panel>

            {issueOpen && (
              <Panel title="Report an issue">
                <textarea
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  placeholder=""
                  rows={4}
                  style={fieldStyle}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    disabled={busy || !issueNote.trim()}
                    onClick={handleReportIssue}
                  >
                    Submit issue
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => setIssueOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </Panel>
            )}
          </div>

          <div>
            <Panel title="QR code">
              <div
                style={{
                  aspectRatio: "1 / 1",
                  maxWidth: 180,
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 8,
                  border: "1.5px dashed var(--border-soft)",
                  borderRadius: 12,
                  color: "var(--ink-600)",
                }}
              >
                <Icon size={40}>{IconPaths.qr}</Icon>
                <span className="mono" style={{ fontSize: 11.5 }}>
                  {delivery.id}
                </span>
              </div>
              <p
                style={{
                  fontSize: 11.5,
                  color: "var(--ink-600)",
                  textAlign: "center",
                  marginTop: 10,
                }}
              >
                Scannable QR generation is coming soon 
              </p>
            </Panel>

            <Panel title="Actions">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {(delivery.status === "assigned" ||
                  delivery.status === "overdue") && (
                  <button
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={handleAccept}
                  >
                    <Icon size={15} style={{ marginRight: 6 }}>
                      {IconPaths.check}
                    </Icon>
                    Accept delivery
                  </button>
                )}
                {(delivery.status === "assigned" ||
                  delivery.status === "overdue" ||
                  delivery.status === "accepted") && (
                  <button
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={handleStartTrip}
                  >
                    <Icon size={15} style={{ marginRight: 6 }}>
                      {IconPaths.truck}
                    </Icon>
                    Start trip
                  </button>
                )}
                <p style={{ fontSize: 12, color: 'var(--ink-600)', margin: 0 }}>Issue reporting is not available yet.</p>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
