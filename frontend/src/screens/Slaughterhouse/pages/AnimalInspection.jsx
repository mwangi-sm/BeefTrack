import { useState, useEffect } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, CareRow, DetailRow, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { RecordDetailModal } from "../../../components/RecordDetailModal";
import { FormField } from "../components/Formfield";
import { fetchInspectionQueue, createInspection, recordInspection, deleteInspection } from "../services/slaughterhouseApi";

const STATUS_MAP = {
  pending: { status: "soon", label: "Awaiting inspection" },
  approved: { status: "ok", label: "Approved for slaughter" },
  rejected: { status: "overdue", label: "Rejected — not for slaughter" },
};

const BODY_CONDITION_OPTIONS = [
  "Very poor",
  "Poor",
  "Fair",
  "Good",
  "Excellent",
];

const BLANK_DRAFT = {
  tagId: "",
  vet: "",
  batch: "",
  healthCheck: "",
  bodyCondition: "",
  signsOfDisease: "",
  temperature: "",
  notes: "",
};

export function AnimalInspection() {
  const [records, setRecords] = useState([]);
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
    fetchInspectionQueue()
      .then((data) => { setRecords(data); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const selected = records.find((r) => r.tagId === selectedId) || null;
  const updateDraft = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...draft,
        temperature: draft.temperature ? Number(draft.temperature) : null,
      };
      const created = await createInspection(payload);
      setRecords((prev) => [{ ...payload, ...created, outcome: "pending" }, ...prev]);
      setDraft(BLANK_DRAFT);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDecide(record, outcome) {
    setSaving(true);
    try {
      await recordInspection(record.tagId, { outcome });
      setRecords((prev) =>
        prev.map((r) =>
          r.tagId === record.tagId ? { ...r, outcome } : r
        )
      );
      setSelectedId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    setDeleting(true);
    try {
      await deleteInspection(record.tagId);
      setRecords((prev) => prev.filter((r) => r.tagId !== record.tagId));
      setSelectedId(null);
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DashHead
        title="Animal Inspection"
        subtitle="Assess body condition, detect disease signs, and approve or reject for slaughter."
      />

      <Panel
        title="Inspection queue"
        action={
          <button className="btn btn-outline" onClick={() => setShowForm((s) => !s)}>
            <Icon size={14} style={{ marginRight: 2 }}>{showForm ? IconPaths.close : IconPaths.plus}</Icon>
            {showForm ? "Cancel" : "Log inspection"}
          </button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <FormField label="Tag ID" value={draft.tagId} onChange={updateDraft("tagId")} placeholder="e.g. BT-000601" required />
              <FormField label="Batch number" value={draft.batch} onChange={updateDraft("batch")} placeholder="e.g. B-20260719-A" />
              <FormField label="Veterinarian" value={draft.vet} onChange={updateDraft("vet")} placeholder="Vet name" required />
              <FormField label="Body condition" as="select" value={draft.bodyCondition} onChange={updateDraft("bodyCondition")}>
                <option value="">Select body condition</option>
                {BODY_CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </FormField>
              <FormField
                label="Health check"
                value={draft.healthCheck}
                onChange={updateDraft("healthCheck")}
                placeholder="e.g. Normal vitals, clear lungs"
              />
              <FormField
                label="Temperature (°C)"
                type="number"
                step="0.1"
                min="35"
                max="43"
                value={draft.temperature}
                onChange={updateDraft("temperature")}
                placeholder="e.g. 38.5 (optional)"
              />
            </div>
            <FormField
              as="textarea"
              rows={2}
              label="Signs of disease"
              value={draft.signsOfDisease}
              onChange={updateDraft("signsOfDisease")}
              placeholder="Describe any visible disease signs — nasal discharge, coughing, diarrhoea, swelling, lesions. Write 'None' if healthy."
            />
            <FormField
              as="textarea"
              rows={2}
              label="Additional notes"
              value={draft.notes}
              onChange={updateDraft("notes")}
              placeholder="Any additional findings or comments"
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={creating || !draft.tagId || !draft.vet}>
                <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.save}</Icon>
                {creating ? "Saving…" : "Save inspection"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} disabled={creating}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {status === "loading" && <LoadingState label="Loading inspection queue…" />}
        {status === "error" && <ErrorState message="Couldn't load the inspection queue." onRetry={load} />}
        {status === "ready" && records.length === 0 && (
          <EmptyState
            icon={IconPaths.health}
            title="No animals awaiting inspection"
            subtitle="Log an inspection above, or wait for one recorded on the floor."
          />
        )}
        {status === "ready" && records.map((r) => {
          const meta = STATUS_MAP[r.outcome || "pending"] || STATUS_MAP.pending;
          return (
            <CareRow
              key={r.tagId}
              id={r.tagId}
              type={r.vet ? `Vet: ${r.vet}` : "No veterinarian assigned"}
              due={r.batch ? `Batch ${r.batch}` : "No batch recorded"}
              status={meta.status}
              label={meta.label}
              onClick={() => setSelectedId(r.tagId)}
            />
          );
        })}
      </Panel>

      <RecordDetailModal open={!!selected} onClose={() => { setSelectedId(null); setDeleteConfirm(false); }} title={selected ? `Inspection — ${selected.tagId}` : ""}>
        {selected && (
          <>
            <DetailRow label="Veterinarian" value={selected.vet} />
            <DetailRow label="Body condition" value={selected.bodyCondition} />
            <DetailRow label="Health check" value={selected.healthCheck} />
            <DetailRow label="Temperature" value={selected.temperature ? `${selected.temperature} °C` : null} />
            <DetailRow label="Signs of disease" value={selected.signsOfDisease} />
            <DetailRow label="Notes" value={selected.notes} />
            {(!selected.outcome || selected.outcome === "pending") && (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" disabled={saving} onClick={() => { handleDecide(selected, "approved"); }}>
                  <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.check}</Icon>
                  Approve for slaughter
                </button>
                <button className="btn btn-outline" disabled={saving} onClick={() => { handleDecide(selected, "rejected"); }}>
                  <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.close}</Icon>
                  Reject
                </button>
              </div>
            )}
            {(selected.outcome === "approved" || selected.outcome === "rejected") && (
              <div style={{ marginTop: 12 }}>
                <span
                  className={`status-pill status-${selected.outcome === "approved" ? "ok" : "overdue"}`}
                >
                  {selected.outcome === "approved" ? "Approved for slaughter" : "Rejected — not for slaughter"}
                </span>
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
                  Delete record
                </button>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "var(--rust-600)" }}>
                  <span>Delete this inspection record?</span>
                  <button
                    className="btn btn-outline"
                    style={{ borderColor: "var(--rust-500)", color: "var(--rust-600)" }}
                    disabled={deleting}
                    onClick={() => handleDelete(selected)}
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
