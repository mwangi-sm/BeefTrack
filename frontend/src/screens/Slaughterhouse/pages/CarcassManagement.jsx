import { useState, useEffect, useRef } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, CareRow, DetailRow, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { RecordDetailModal } from "../../../components/RecordDetailModal";
import { FormField } from "../components/Formfield";
import { fetchCarcasses, createCarcass, deleteCarcass } from "../services/slaughterhouseApi";
import QRCode from "qrcode";

const BLANK_DRAFT = { id: "", tagId: "", weight: "", grade: "", storage: "" };

export function CarcassManagement() {
  const [carcasses, setCarcasses] = useState([]);
  const [status, setStatus] = useState("loading");
  const [selectedId, setSelectedId] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const canvasRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(BLANK_DRAFT);
  const [creating, setCreating] = useState(false);

  function load() {
    setStatus("loading");
    fetchCarcasses()
      .then((data) => { setCarcasses(data); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const selected = carcasses.find((c) => c.id === selectedId) || null;
  const selectCarcass = (id) => { setQrDataUrl(null); setSelectedId(id); setDeleteConfirm(false); };
  const updateDraft = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  // Generate QR code whenever a different carcass is selected
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const traceData = JSON.stringify({
      id: selected.id,
      tagId: selected.tagId,
      weight: selected.weight,
      grade: selected.grade,
      storage: selected.storage,
    });
    QRCode.toDataURL(traceData, { width: 280, margin: 2, color: { dark: "#1a1a2e", light: "#ffffff" } })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [selected]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...draft, weight: draft.weight ? Number(draft.weight) : null };
      const created = await createCarcass(payload);
      setCarcasses((prev) => [{ ...payload, ...created }, ...prev]);
      setDraft(BLANK_DRAFT);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteCarcass(selected.id);
      setCarcasses((prev) => prev.filter((c) => c.id !== selected.id));
      setSelectedId(null);
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  function downloadQR() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `carcass-${selected.id}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <DashHead
        title="Carcass Management"
        subtitle="Log carcass records — link to animal, assign grade, set storage, and generate QR codes."
      />

      <Panel
        title="Carcasses"
        action={
          <button className="btn btn-outline" onClick={() => setShowForm((s) => !s)}>
            <Icon size={14} style={{ marginRight: 2 }}>{showForm ? IconPaths.close : IconPaths.plus}</Icon>
            {showForm ? "Cancel" : "Log carcass"}
          </button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <FormField label="Carcass ID" value={draft.id} onChange={updateDraft("id")} placeholder="e.g. CC-000198" required />
              <FormField label="Animal Tag ID" value={draft.tagId} onChange={updateDraft("tagId")} placeholder="e.g. TAG-000198" required />
              <FormField label="Weight (kg)" type="number" min="0" value={draft.weight} onChange={updateDraft("weight")} placeholder="e.g. 218" />
              <FormField as="select" label="Grade" value={draft.grade} onChange={updateDraft("grade")}>
                <option value="">Select grade…</option>
                <option value="Grade A">Grade A</option>
                <option value="Grade B">Grade B</option>
                <option value="Grade C">Grade C</option>
              </FormField>
              <FormField label="Storage location" value={draft.storage} onChange={updateDraft("storage")} placeholder="e.g. Cold Room 1" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={creating || !draft.id || !draft.tagId}>
                <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.save}</Icon>
                {creating ? "Saving…" : "Save carcass"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} disabled={creating}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {status === "loading" && <LoadingState label="Loading carcass records…" />}
        {status === "error" && <ErrorState message="Couldn't load carcass records." onRetry={load} />}
        {status === "ready" && carcasses.length === 0 && (
          <EmptyState
            icon={IconPaths.cut}
            title="No carcasses recorded yet"
            subtitle="Log one above once slaughter processing completes."
          />
        )}
        {status === "ready" && carcasses.map((c) => (
          <CareRow
            key={c.id}
            id={c.id}
            type={`Animal ${c.tagId || "—"} · ${c.grade || "Ungraded"}`}
            due={c.storage ? `Storage: ${c.storage}` : "Storage not assigned"}
            status="ok"
            label="Recorded"
            onClick={() => selectCarcass(c.id)}
          />
        ))}
      </Panel>

      <RecordDetailModal open={!!selected} onClose={() => { setSelectedId(null); setDeleteConfirm(false); }} title={selected ? `Carcass ${selected.id}` : ""}>
        {selected && (
          <>
            <DetailRow label="Carcass ID" value={selected.id} />
            <DetailRow label="Animal Tag ID" value={selected.tagId} />
            <DetailRow label="Weight" value={selected.weight ? `${selected.weight} kg` : null} />
            <DetailRow label="Grade" value={selected.grade} />
            <DetailRow label="Storage location" value={selected.storage} />

            <div style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid var(--border-soft)",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 12 }}>
                Traceability QR Code
              </p>
              {qrDataUrl ? (
                <img
                  ref={canvasRef}
                  src={qrDataUrl}
                  alt={`QR code for carcass ${selected.id}`}
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: 8,
                    border: "1px solid var(--border-soft)",
                    background: "#fff",
                    padding: 8,
                    margin: "0 auto",
                    display: "block",
                  }}
                />
              ) : (
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 8,
                  border: "1px solid var(--border-soft)",
                  background: "var(--cream-50)",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "var(--ink-600)",
                }}>
                  Generating QR…
                </div>
              )}
              <p style={{ fontSize: 11.5, color: "var(--ink-600)", marginTop: 8, marginBottom: 14 }}>
                Scan to view carcass traceability data
              </p>
              <button className="btn btn-outline" onClick={downloadQR} disabled={!qrDataUrl}>
                <Icon size={14} style={{ marginRight: 2 }}>{IconPaths.download}</Icon>
                Download QR Code
              </button>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-soft)" }}>
              {!deleteConfirm ? (
                <button
                  className="btn btn-outline"
                  style={{ borderColor: "var(--rust-500)", color: "var(--rust-600)" }}
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Icon size={14} style={{ marginRight: 2 }}>{IconPaths.trash}</Icon>
                  Delete carcass
                </button>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "var(--rust-600)" }}>
                  <span>Delete this carcass record?</span>
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
