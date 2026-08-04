import { useState, useEffect } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, CareRow, DetailRow, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { RecordDetailModal } from "../../../components/RecordDetailModal";
import { FormField } from "../components/Formfield";
import { fetchCarcassInspections, createCarcassInspection, recordCarcassInspection, deleteCarcassInspection } from "../services/slaughterhouseApi";

const OUTCOME_MAP = {
  passed: { status: "ok", label: "Passed" },
  conditionally_passed: { status: "soon", label: "Conditionally Passed" },
  condemned: { status: "overdue", label: "Condemned" },
};

const BLANK_DRAFT = { carcassId: "", tagId: "", inspector: "", outcome: "", reason: "", comments: "" };

export function CarcassInspection() {
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
    fetchCarcassInspections()
      .then((data) => { setRecords(data); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const selected = records.find((r) => r.carcassId === selectedId) || null;
  const updateDraft = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await createCarcassInspection(draft);
      setRecords((prev) => [{ ...draft, ...created }, ...prev]);
      setDraft(BLANK_DRAFT);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function updateOutcome(record, outcome) {
    setSaving(true);
    try {
      await recordCarcassInspection(record.carcassId, { outcome });
      setRecords((prev) => prev.map((r) => (r.carcassId === record.carcassId ? { ...r, outcome } : r)));
      setSelectedId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteCarcassInspection(selected.carcassId);
      setRecords((prev) => prev.filter((r) => r.carcassId !== selected.carcassId));
      setSelectedId(null);
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DashHead
        title="Carcass Inspection"
        subtitle="Record post-mortem inspection decisions — Passed, Conditionally Passed, or Condemned."
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
              <FormField label="Carcass ID" value={draft.carcassId} onChange={updateDraft("carcassId")} placeholder="e.g. CC-000551" required />
              <FormField label="Animal Tag ID" value={draft.tagId} onChange={updateDraft("tagId")} placeholder="e.g. TAG-000198" required />
              <FormField label="Inspector" value={draft.inspector} onChange={updateDraft("inspector")} placeholder="Inspector name" required />
              <FormField as="select" label="Outcome" value={draft.outcome} onChange={updateDraft("outcome")} required>
                <option value="">Select outcome…</option>
                <option value="passed">Passed</option>
                <option value="conditionally_passed">Conditionally Passed</option>
                <option value="condemned">Condemned</option>
              </FormField>
            </div>
            {draft.outcome === "condemned" && (
              <FormField label="Reason for condemnation" value={draft.reason} onChange={updateDraft("reason")} placeholder="e.g. Evidence of disease, contamination" required />
            )}
            <FormField as="textarea" rows={2} label="Inspector comments" value={draft.comments} onChange={updateDraft("comments")} placeholder="Detailed findings and observations" />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={creating || !draft.carcassId || !draft.tagId || !draft.inspector || !draft.outcome}>
                <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.save}</Icon>
                {creating ? "Saving…" : "Save inspection"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} disabled={creating}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {status === "loading" && <LoadingState label="Loading carcass inspection queue…" />}
        {status === "error" && <ErrorState message="Couldn't load the inspection queue." onRetry={load} />}
        {status === "ready" && records.length === 0 && (
          <EmptyState
            icon={IconPaths.health}
            title="No carcasses awaiting inspection"
            subtitle="Log an inspection above, or wait for carcasses to be queued for post-mortem review."
          />
        )}
        {status === "ready" && records.map((r) => {
          const meta = OUTCOME_MAP[r.outcome] || OUTCOME_MAP.passed;
          return (
            <CareRow
              key={r.carcassId}
              id={r.carcassId}
              type={r.inspector ? `Inspected by ${r.inspector}` : "No inspector assigned"}
              due={r.tagId ? `Animal ${r.tagId}` : "No animal linked"}
              status={meta.status}
              label={meta.label}
              onClick={() => { setSelectedId(r.carcassId); setDeleteConfirm(false); }}
            />
          );
        })}
      </Panel>

      <RecordDetailModal open={!!selected} onClose={() => { setSelectedId(null); setDeleteConfirm(false); }} title={selected ? `Inspection — ${selected.carcassId}` : ""}>
        {selected && (
          <>
            <DetailRow label="Carcass ID" value={selected.carcassId} />
            <DetailRow label="Animal Tag ID" value={selected.tagId} />
            <DetailRow label="Inspector" value={selected.inspector} />
            <DetailRow
              label="Outcome"
              value={
                <span style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  background:
                    selected.outcome === "passed" ? "var(--success-100, #e6f7e6)" :
                    selected.outcome === "conditionally_passed" ? "var(--cream-50, #fff8e6)" :
                    "var(--rust-100, #fde8e8)",
                  color:
                    selected.outcome === "passed" ? "var(--success-600, #2d6e3d)" :
                    selected.outcome === "conditionally_passed" ? "var(--gold-700, #b8860b)" :
                    "var(--rust-700, #a33a3a)",
                }}>
                  {selected.outcome === "passed" ? "Passed" :
                   selected.outcome === "conditionally_passed" ? "Conditionally Passed" :
                   "Condemned"}
                </span>
              }
            />
            {selected.outcome === "condemned" && selected.reason && (
              <DetailRow label="Reason for condemnation" value={selected.reason} />
            )}
            {selected.comments && (
              <DetailRow label="Inspector comments" value={selected.comments} />
            )}
            {(!selected.outcome) && (
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <button className="btn btn-primary" disabled={saving} onClick={() => { updateOutcome(selected, "passed"); }}>
                  <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.check}</Icon>
                  Mark Passed
                </button>
                <button className="btn btn-outline" disabled={saving} onClick={() => { updateOutcome(selected, "conditionally_passed"); }}>
                  <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.flag}</Icon>
                  Mark Conditionally Passed
                </button>
                <button className="btn btn-outline" disabled={saving} onClick={() => { updateOutcome(selected, "condemned"); }} style={{ borderColor: "var(--rust-500)", color: "var(--rust-600)" }}>
                  <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.close}</Icon>
                  Mark Condemned
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
                  Delete record
                </button>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "var(--rust-600)" }}>
                  <span>Delete this inspection record?</span>
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
