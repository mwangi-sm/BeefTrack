import { useState, useEffect } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, CareRow, DetailRow, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { RecordDetailModal } from "../../../components/RecordDetailModal";
import { FormField } from "../components/Formfield";
import { fetchShipments, createShipment, advanceShipment, deleteShipment } from "../services/slaughterhouseApi";

const STATUS_MAP = {
  scheduled: { status: "soon", label: "Scheduled" },
  in_transit: { status: "soon", label: "In transit" },
  delivered: { status: "ok", label: "Delivered" },
  delayed: { status: "overdue", label: "Delayed" },
};

const NEXT_LABEL = {
  scheduled: "Dispatch",
  in_transit: "Mark delivered",
};

const BLANK_DRAFT = { id: "", destination: "", processor: "", driver: "", vehicle: "", departure: "" };

export function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [status, setStatus] = useState("loading");
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(BLANK_DRAFT);
  const [creating, setCreating] = useState(false);

  function load() {
    setStatus("loading");
    fetchShipments()
      .then((data) => { setShipments(data); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const selected = shipments.find((s) => s.id === selectedId) || null;
  const updateDraft = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await createShipment(draft);
      setShipments((prev) => [{ ...draft, ...created, status: "scheduled" }, ...prev]);
      setDraft(BLANK_DRAFT);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function advance(shipment) {
    setSaving(true);
    try {
      await advanceShipment(shipment.id);
      const next = shipment.status === "scheduled" ? "in_transit" : "delivered";
      setShipments((prev) => prev.map((s) => (s.id === shipment.id ? { ...s, status: next } : s)));
      setSelectedId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteShipment(selected.id);
      setShipments((prev) => prev.filter((s) => s.id !== selected.id));
      setSelectedId(null);
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DashHead
        title="Shipments"
        subtitle="Schedule outgoing carcasses and cuts to processors and distributors."
      />

      <Panel
        title="Shipments"
        action={
          <button className="btn btn-outline" onClick={() => setShowForm((s) => !s)}>
            <Icon size={14} style={{ marginRight: 2 }}>{showForm ? IconPaths.close : IconPaths.plus}</Icon>
            {showForm ? "Cancel" : "Log shipment"}
          </button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <FormField label="Shipment ID" value={draft.id} onChange={updateDraft("id")} placeholder="e.g. SH-000198" required />
              <FormField label="Destination" value={draft.destination} onChange={updateDraft("destination")} placeholder="e.g. Uptown Butchers, Nairobi CBD" required />
              <FormField label="Processor / distributor" value={draft.processor} onChange={updateDraft("processor")} placeholder="Company name" />
              <FormField label="Driver" value={draft.driver} onChange={updateDraft("driver")} placeholder="Driver name" />
              <FormField label="Vehicle" value={draft.vehicle} onChange={updateDraft("vehicle")} placeholder="e.g. KDA 221B" />
              <FormField label="Departure" type="datetime-local" value={draft.departure} onChange={updateDraft("departure")} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={creating || !draft.id || !draft.destination}>
                <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.save}</Icon>
                {creating ? "Saving…" : "Save shipment"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} disabled={creating}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {status === "loading" && <LoadingState label="Loading shipments…" />}
        {status === "error" && <ErrorState message="Couldn't load shipments." onRetry={load} />}
        {status === "ready" && shipments.length === 0 && (
          <EmptyState
            icon={IconPaths.truck}
            title="No shipments scheduled"
            subtitle="Log one above once carcasses are ready to dispatch."
          />
        )}
        {status === "ready" && shipments.map((s) => {
          const meta = STATUS_MAP[s.status] || STATUS_MAP.scheduled;
          return (
            <CareRow
              key={s.id}
              id={s.id}
              type={s.destination || "No destination recorded"}
              due={s.departure ? `Departs ${s.departure}` : "Departure not scheduled"}
              status={meta.status}
              label={meta.label}
              onClick={() => { setSelectedId(s.id); setDeleteConfirm(false); }}
            />
          );
        })}
      </Panel>

      <RecordDetailModal open={!!selected} onClose={() => { setSelectedId(null); setDeleteConfirm(false); }} title={selected ? `Shipment ${selected.id}` : ""}>
        {selected && (
          <>
            <DetailRow label="Destination" value={selected.destination} />
            <DetailRow label="Processor / distributor" value={selected.processor} />
            <DetailRow label="Driver" value={selected.driver} />
            <DetailRow label="Vehicle" value={selected.vehicle} />
            <DetailRow label="Departure" value={selected.departure} />
            {(selected.status === "scheduled" || selected.status === "in_transit") && (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" disabled={saving} onClick={() => { advance(selected); }}>
                  <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.truck}</Icon>
                  {NEXT_LABEL[selected.status]}
                </button>
              </div>
            )}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-soft)" }}>
              {!deleteConfirm ? (
                <button
                  className="btn btn-outline"
                  style={{ borderColor: "var(--rust-500)", color: "var(--rust-600)" }}
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Icon size={14} style={{ marginRight: 2 }}>{IconPaths.trash}</Icon>
                  Delete shipment
                </button>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "var(--rust-600)" }}>
                  <span>Delete this shipment record?</span>
                  <button
                    className="btn btn-outline"
                    style={{ borderColor: "var(--rust-500)", color: "var(--rust-600)" }}
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    className="btn btn-outline"
                    disabled={deleting}
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </RecordDetailModal>
    </>
  );
}
