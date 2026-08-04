import { useState, useEffect } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, CareRow, DetailRow, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { RecordDetailModal } from "../../../components/RecordDetailModal";
import { FormField } from "../components/Formfield";
import {
  fetchReceptionQueue,
  lookupAnimalByTag,
  createAnimal,
  acceptAnimal,
  rejectAnimal,
  deleteAnimal,
} from "../services/slaughterhouseApi";

const STATUS_MAP = {
  pending: { status: "soon", label: "Awaiting decision" },
  accepted: { status: "ok", label: "Accepted" },
  rejected: { status: "overdue", label: "Rejected" },
};

const CONDITION_OPTIONS = [
  "Good",
  "Fair",
  "Poor",
  "Injured",
  "Lame",
  "Emaciated",
  "Sick",
];

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function blankArrival(animal) {
  return {
    tagId: animal?.id || "",
    arrivalDate: nowDate(),
    arrivalTime: nowTime(),
    transporter: "",
    vehicleNumber: "",
    numberOfAnimals: 1,
    condition: "Good",
    injuries: "",
    farmer: animal?.farmer || "",
    breed: animal?.breed || "",
    weight: animal?.weight ? String(animal.weight) : "",
    batch: animal?.batch || "",
  };
}

function AnimalDetails({ animal }) {
  return (
    <>
      <DetailRow label="Farmer / source" value={animal.farmer} />
      <DetailRow label="Breed" value={animal.breed} />
      <DetailRow label="Weight" value={animal.weight ? `${animal.weight} kg` : null} />
      <DetailRow label="Batch" value={animal.batch} />
    </>
  );
}

export function AnimalReception() {
  const [animals, setAnimals] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ---- Tag lookup phase ----
  const [tagInput, setTagInput] = useState("");
  const [lookupState, setLookupState] = useState("idle"); // idle | looking | found | not_found
  const [lookedUpAnimal, setLookedUpAnimal] = useState(null);

  // ---- Arrival form phase ----
  const [arrivalDraft, setArrivalDraft] = useState(blankArrival(null));
  const [creating, setCreating] = useState(false);

  function load() {
    setStatus("loading");
    fetchReceptionQueue()
      .then((data) => { setAnimals(data); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const selected = animals.find((a) => a.tagId === selectedId) || null;

  const updateArrival = (field) => (e) =>
    setArrivalDraft((d) => ({ ...d, [field]: e.target.value }));

  // ---- Tag lookup ----
  async function handleLookup(e) {
    e?.preventDefault();
    const raw = tagInput.trim();
    if (!raw) return;
    setLookupState("looking");
    try {
      const animal = await lookupAnimalByTag(raw);
      if (animal) {
        setLookedUpAnimal(animal);
        setArrivalDraft(blankArrival(animal));
        setLookupState("found");
      } else {
        setLookedUpAnimal(null);
        setArrivalDraft(blankArrival(null));
        setLookupState("not_found");
      }
    } catch {
      setLookupState("not_found");
    }
  }

  function handleResetLookup() {
    setTagInput("");
    setLookupState("idle");
    setLookedUpAnimal(null);
    setArrivalDraft(blankArrival(null));
  }

  // ---- Record arrival ----
  async function handleRecordArrival(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        tagId: arrivalDraft.tagId,
        arrivalDate: arrivalDraft.arrivalDate,
        arrivalTime: arrivalDraft.arrivalTime,
        transporter: arrivalDraft.transporter,
        vehicleNumber: arrivalDraft.vehicleNumber,
        numberOfAnimals: arrivalDraft.numberOfAnimals
          ? Number(arrivalDraft.numberOfAnimals)
          : 1,
        condition: arrivalDraft.condition,
        injuries: arrivalDraft.injuries,
        farmer: arrivalDraft.farmer,
        breed: arrivalDraft.breed,
        weight: arrivalDraft.weight ? Number(arrivalDraft.weight) : null,
        batch: arrivalDraft.batch,
        status: "pending",
      };
      const created = await createAnimal(payload);
      setAnimals((prev) => [{ ...payload, ...created }, ...prev]);
      handleResetLookup();
    } finally {
      setCreating(false);
    }
  }

  async function handleAccept(animal) {
    setSaving(true);
    try {
      await acceptAnimal(animal.tagId, {});
      setAnimals((prev) =>
        prev.map((a) =>
          a.tagId === animal.tagId ? { ...a, status: "accepted" } : a
        )
      );
      setSelectedId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleReject(animal) {
    setSaving(true);
    try {
      await rejectAnimal(animal.tagId, {});
      setAnimals((prev) =>
        prev.map((a) =>
          a.tagId === animal.tagId ? { ...a, status: "rejected" } : a
        )
      );
      setSelectedId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(animal) {
    setDeleting(true);
    try {
      await deleteAnimal(animal.tagId);
      setAnimals((prev) => prev.filter((a) => a.tagId !== animal.tagId));
      setSelectedId(null);
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DashHead
        title="Animal Reception"
        subtitle="Scan or enter a tag to log incoming animals and record arrivals."
      />

      {/* ---- Tag lookup panel ---- */}
      <Panel
        title="Step 1 — Scan or enter tag"
        action={
          lookupState !== "idle" ? (
            <button className="btn btn-outline" onClick={handleResetLookup}>
              <Icon size={14} style={{ marginRight: 2 }}>{IconPaths.close}</Icon>
              Clear
            </button>
          ) : null
        }
      >
        {lookupState === "idle" && (
          <form onSubmit={handleLookup}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <FormField
                  label="Animal tag ID"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Scan RFID or type tag, e.g. BT-000601"
                  autoFocus
                  required
                />
              </div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!tagInput.trim()}
                style={{ marginBottom: 14, height: 41 }}
              >
                <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.search}</Icon>
                Look up
              </button>
            </div>
          </form>
        )}

        {lookupState === "looking" && (
          <LoadingState label="Looking up animal…" />
        )}

        {lookupState === "not_found" && (
          <div
            style={{
              textAlign: "center",
              padding: "24px 16px",
              color: "var(--rust-600)",
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <Icon size={28} style={{ opacity: 0.6 }}>
                {IconPaths.warning}
              </Icon>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)", marginBottom: 4 }}>
              Tag not found
            </div>
            <div style={{ fontSize: 13, marginBottom: 14 }}>
              &ldquo;{tagInput}&rdquo; is not registered in the system.
              Make sure the tag is correct, or add a manual record below.
            </div>
            <button className="btn btn-outline" onClick={handleResetLookup}>
              Try another tag
            </button>
          </div>
        )}

        {lookupState === "found" && lookedUpAnimal && (
          <div
            style={{
              padding: "6px 0 4px",
              borderBottom: "1px solid var(--border-soft)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <Icon size={20} color="var(--success-600, #3f6b49)">
                {IconPaths.verified}
              </Icon>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--success-600, #3f6b49)" }}>
                Animal found — {lookedUpAnimal.id}
              </span>
            </div>
            <AnimalDetails animal={lookedUpAnimal} />
          </div>
        )}
      </Panel>

      {/* ---- Arrival recording form (shown after tag is found or not found) ---- */}
      {(lookupState === "found" || lookupState === "not_found") && (
        <Panel title="Step 2 — Record arrival details">
          <form onSubmit={handleRecordArrival}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0,
              }}
            >
              <FormField
                label="Arrival date"
                type="date"
                value={arrivalDraft.arrivalDate}
                onChange={updateArrival("arrivalDate")}
                required
              />
              <FormField
                label="Arrival time"
                type="time"
                value={arrivalDraft.arrivalTime}
                onChange={updateArrival("arrivalTime")}
                required
              />
              <FormField
                label="Transporter"
                value={arrivalDraft.transporter}
                onChange={updateArrival("transporter")}
                placeholder="e.g. Rift Valley Haulers"
                required
              />
              <FormField
                label="Vehicle number"
                value={arrivalDraft.vehicleNumber}
                onChange={updateArrival("vehicleNumber")}
                placeholder="e.g. KDA 221B"
                required
              />
              <FormField
                label="Number of animals"
                type="number"
                min="1"
                value={arrivalDraft.numberOfAnimals}
                onChange={updateArrival("numberOfAnimals")}
                placeholder="e.g. 1"
                required
              />
              <FormField
                label="Condition on arrival"
                as="select"
                value={arrivalDraft.condition}
                onChange={updateArrival("condition")}
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </FormField>
            </div>

            <FormField
              as="textarea"
              rows={2}
              label="Injuries / abnormalities"
              value={arrivalDraft.injuries}
              onChange={updateArrival("injuries")}
              placeholder="Describe any visible injuries, lameness, discharge, swelling, or abnormalities. Write 'None' if healthy."
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={creating || !arrivalDraft.transporter || !arrivalDraft.vehicleNumber}
              >
                <Icon size={15} style={{ marginRight: 2 }}>
                  {IconPaths.save}
                </Icon>
                {creating ? "Saving…" : "Record arrival"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleResetLookup}
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* ---- Reception queue ---- */}
      <Panel title="Reception queue">
        {status === "loading" && <LoadingState label="Loading reception queue…" />}
        {status === "error" && (
          <ErrorState message="Couldn't load the reception queue." onRetry={load} />
        )}
        {status === "ready" && animals.length === 0 && (
          <EmptyState
            icon={IconPaths.animal}
            title="No animals awaiting reception"
            subtitle="Scan a tag above to log the first arrival."
          />
        )}
        {status === "ready" &&
          animals.map((a) => {
            const meta = STATUS_MAP[a.status] || STATUS_MAP.pending;
            return (
              <CareRow
                key={a.tagId}
                id={a.tagId}
                type={`${a.farmer || "—"} · via ${a.transporter || "—"}`}
                due={
                  a.arrivalDate
                    ? `Arrived ${a.arrivalDate} ${a.arrivalTime || ""}`
                    : "Arrival time not recorded"
                }
                status={meta.status}
                label={meta.label}
                onClick={() => setSelectedId(a.tagId)}
              />
            );
          })}
      </Panel>

      <RecordDetailModal open={!!selected} onClose={() => { setSelectedId(null); setDeleteConfirm(false); }} title={selected ? `Animal ${selected.tagId}` : ""}>
        {selected && (
          <>
            <DetailRow label="Farmer" value={selected.farmer} />
            <DetailRow label="Transporter" value={selected.transporter} />
            <DetailRow label="Vehicle number" value={selected.vehicleNumber} />
            <DetailRow label="Number of animals" value={selected.numberOfAnimals ? String(selected.numberOfAnimals) : null} />
            <DetailRow label="Condition" value={selected.condition} />
            <DetailRow label="Injuries / abnormalities" value={selected.injuries} />
            <DetailRow label="Arrival date" value={selected.arrivalDate} />
            <DetailRow label="Arrival time" value={selected.arrivalTime} />
            <DetailRow label="Breed" value={selected.breed} />
            <DetailRow label="Weight" value={selected.weight ? `${selected.weight} kg` : null} />
            <DetailRow label="Batch" value={selected.batch} />
            {selected.status === "pending" && (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={() => { handleAccept(selected); }}
                >
                  <Icon size={15} style={{ marginRight: 2 }}>
                    {IconPaths.check}
                  </Icon>
                  Accept
                </button>
                <button
                  className="btn btn-outline"
                  disabled={saving}
                  onClick={() => { handleReject(selected); }}
                >
                  <Icon size={15} style={{ marginRight: 2 }}>
                    {IconPaths.close}
                  </Icon>
                  Reject
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
                  <span>Delete this animal record?</span>
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
