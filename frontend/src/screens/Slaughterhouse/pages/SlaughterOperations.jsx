import { useState, useCallback } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, LoadingState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { FormField } from "../components/Formfield";
import {
  lookupAnimalForSlaughter,
  recordSlaughter,
  recordManualSlaughter,
} from "../services/slaughterhouseApi";
import { getCurrentMockUser } from "../../../lib/mockAuth";

// ─── helpers ──────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function nowTimeStr() {
  return new Date().toTimeString().slice(0, 5);
}

function formatDate(d) {
  if (!d || d === "—") return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

const SLAUGHTER_METHODS = [
  "Halal",
  "Conventional",
  "Stunning followed by slaughter",
  "Emergency slaughter",
  "Other",
];

const SLAUGHTER_LINES = ["Line 1", "Line 2", "Emergency Line", "Halal Line"];

const BREED_OPTIONS = [
  "Boran",
  "Sahiwal",
  "Zebu Cross",
  "Ayrshire",
  "Friesian",
  "Hereford",
  "Angus",
  "Charolais",
  "Limousin",
  "Other",
];

const SEX_OPTIONS = ["Male", "Female", "Unknown"];

// ─── component ────────────────────────────────────────────────────────────

export function SlaughterOperations() {
  // mode: "lookup" | "manual"
  const [mode, setMode] = useState("lookup");

  // ── look-up stage ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [lookupStatus, setLookupStatus] = useState("idle"); // idle | looking | found | not_found | not_approved | error
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState("");

  // ── manual-entry fields ─────────────────────────────────────────────────
  const [manualId, setManualId] = useState("");
  const [manualEarTag, setManualEarTag] = useState("");
  const [manualBreed, setManualBreed] = useState("");
  const [manualOtherBreed, setManualOtherBreed] = useState("");
  const [manualSex, setManualSex] = useState("");
  const [manualWeight, setManualWeight] = useState("");
  const [manualOwner, setManualOwner] = useState("");
  const [anteMortemConfirmed, setAnteMortemConfirmed] = useState(false);

  // ── slaughter details (shared) ──────────────────────────────────────────
  const [slaughterDate, setSlaughterDate] = useState(todayStr);
  const [slaughterTime, setSlaughterTime] = useState(nowTimeStr);
  const [method, setMethod] = useState("");
  const [otherMethod, setOtherMethod] = useState("");
  const [facility, setFacility] = useState("");
  const [remarks, setRemarks] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // ── submission ──────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [doneLabel, setDoneLabel] = useState("");

  // current user info (read synchronously from sessionStorage)
  const [officerName] = useState(() => {
    const user = getCurrentMockUser();
    return user?.fullname || "Officer";
  });

  // ── look up the animal ──────────────────────────────────────────────────

  const handleLookup = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setLookupStatus("looking");
    setLookupError("");
    setLookupResult(null);
    try {
      const result = await lookupAnimalForSlaughter(q);
      if (!result.animal) {
        setLookupStatus("not_found");
        setLookupError(result.reason);
      } else if (!result.canSlaughter) {
        setLookupStatus("not_approved");
        setLookupResult(result);
        setLookupError(result.reason);
      } else {
        setLookupStatus("found");
        setLookupResult(result);
      }
    } catch {
      setLookupStatus("error");
      setLookupError("Could not look up the animal. Try again.");
    }
  }, [searchQuery]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") handleLookup();
  };

  // ── reset ───────────────────────────────────────────────────────────────

  function resetForm() {
    setSearchQuery("");
    setLookupStatus("idle");
    setLookupResult(null);
    setLookupError("");
    setManualId("");
    setManualEarTag("");
    setManualBreed("");
    setManualOtherBreed("");
    setManualSex("");
    setManualWeight("");
    setManualOwner("");
    setAnteMortemConfirmed(false);
    setSlaughterDate(todayStr);
    setSlaughterTime(nowTimeStr);
    setMethod("");
    setOtherMethod("");
    setFacility("");
    setRemarks("");
    setConfirmed(false);
    setDone(false);
    setDoneLabel("");
    setMode("lookup");
  }

  // ── show manual entry inline ────────────────────────────────────────────

  function openManual() {
    setMode("manual");
  }

  // ── record slaughter ────────────────────────────────────────────────────

  async function handleRecord(e) {
    e.preventDefault();
    if (saving) return;

    // validate shared fields
    if (!method || !facility) return;

    setSaving(true);
    try {
      if (mode === "lookup") {
        if (!confirmed || !lookupResult?.animal) {
          setSaving(false);
          return;
        }
        const payload = {
          animalId: lookupResult.animal.id,
          slaughterDate,
          slaughterTime,
          officer: officerName,
          method,
          ...(method === "Other" && otherMethod.trim()
            ? { otherMethod: otherMethod.trim() }
            : {}),
          facility,
          remarks: remarks.trim() || "",
        };
        await recordSlaughter(payload);
        setDoneLabel(
          `${lookupResult.animal.id} — ${formatDate(slaughterDate)} at ${slaughterTime}`
        );
      } else {
        // manual mode
        if (!confirmed || !manualId.trim() || !manualBreed || !manualOwner.trim() || !anteMortemConfirmed) {
          setSaving(false);
          return;
        }
        const payload = {
          animalId: manualId.trim(),
          earTag: manualEarTag.trim() || undefined,
          breed: manualBreed === "Other" ? manualOtherBreed.trim() || manualBreed : manualBreed,
          sex: manualSex || undefined,
          weight: manualWeight ? Number(manualWeight) : undefined,
          owner: manualOwner.trim(),
          slaughterDate,
          slaughterTime,
          officer: officerName,
          method,
          ...(method === "Other" && otherMethod.trim()
            ? { otherMethod: otherMethod.trim() }
            : {}),
          facility,
          remarks: remarks.trim() || "",
          anteMortemConfirmed,
        };
        await recordManualSlaughter(payload);
        setDoneLabel(
          `${manualId.trim()} — ${formatDate(slaughterDate)} at ${slaughterTime}`
        );
      }
      setDone(true);
    } catch {
      // error while saving
    } finally {
      setSaving(false);
    }
  }

  // ── derive animal from lookup result ────────────────────────────────────

  const animal = lookupResult?.animal || null;

  const canSubmit =
    confirmed &&
    method &&
    facility &&
    !saving &&
    (mode === "lookup"
      ? lookupStatus === "found"
      : manualId.trim() && manualBreed && manualOwner.trim() && anteMortemConfirmed);

  const showDetails =
    (mode === "lookup" && lookupStatus === "found") ||
    mode === "manual";

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <>
      <DashHead
        title="Record Slaughter"
        subtitle="Look up an approved animal or use manual entry for unregistered animals."
      />

      {done ? (
        <Panel title="Slaughter Recorded">
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--success-bg, #e6f4ea)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <Icon size={28} color="var(--success-600, #3f6b49)">
                {IconPaths.check}
              </Icon>
            </div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--ink-900)",
                margin: "0 0 4px",
              }}
            >
              Slaughter recorded successfully
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-600)",
                margin: "0 0 20px",
              }}
            >
              {doneLabel}
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: "var(--ink-600)",
                margin: "0 0 20px",
              }}
            >
              {mode === "lookup"
                ? "The animal is now available for post-mortem / carcass inspection."
                : "A manual animal record has been created. The carcass is available for inspection."}
            </p>
            <button className="btn btn-primary" onClick={resetForm}>
              <Icon size={15} style={{ marginRight: 6 }}>
                {IconPaths.plus}
              </Icon>
              Record another slaughter
            </button>
          </div>
        </Panel>
      ) : (
        <>
          {/* ── Step 1: Choose entry method ─────────────────────────────── */}
          {mode === "idle" && (
            <Panel title="1. Choose Entry Method">
              <p style={{ fontSize: 13, color: "var(--ink-600)", margin: "0 0 18px" }}>
                Select how you want to record this slaughter.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setMode("lookup")}
                  style={{ flex: "1 1 180px", padding: "14px 20px" }}
                >
                  <Icon size={18} style={{ marginRight: 8 }}>
                    {IconPaths.search}
                  </Icon>
                  Look Up Animal
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setMode("manual")}
                  style={{ flex: "1 1 180px", padding: "14px 20px" }}
                >
                  <Icon size={18} style={{ marginRight: 8 }}>
                    {IconPaths.edit}
                  </Icon>
                  Manual Entry
                </button>
              </div>
            </Panel>
          )}

          {/* ── Lookup mode ──────────────────────────────────────────────── */}
          {mode === "lookup" && (
            <Panel
              title="1. Find the Animal"
              action={
                lookupStatus === "found" ? (
                  <button
                    className="btn btn-outline"
                    onClick={resetForm}
                    style={{ fontSize: 12, padding: "5px 12px" }}
                  >
                    <Icon size={12} style={{ marginRight: 4 }}>
                      {IconPaths.close}
                    </Icon>
                    Clear
                  </button>
                ) : (
                  <button
                    className="btn btn-outline"
                    onClick={resetForm}
                    style={{ fontSize: 12, padding: "5px 12px" }}
                  >
                    <Icon size={12} style={{ marginRight: 4 }}>
                      {IconPaths.arrowLeft}
                    </Icon>
                    Back
                  </button>
                )
              }
            >
              {lookupStatus !== "found" && (
                <>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <FormField
                        label="Animal ID or Ear Tag"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (lookupStatus !== "idle" && lookupStatus !== "looking") {
                            setLookupStatus("idle");
                            setLookupError("");
                          }
                        }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="e.g. ANM-000245 or KE-COW-000245"
                        required
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleLookup}
                      disabled={lookupStatus === "looking" || !searchQuery.trim()}
                      style={{
                        marginBottom: 14,
                        height: 40,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {lookupStatus === "looking" ? "Searching…" : "Look up"}
                    </button>
                  </div>

                  {lookupStatus === "looking" && (
                    <LoadingState label="Looking up animal…" />
                  )}

                  {(lookupStatus === "not_found" ||
                    lookupStatus === "not_approved" ||
                    lookupStatus === "error") && (
                    <StatusBanner type="error" message={lookupError} />
                  )}
                </>
              )}

              {lookupStatus === "found" && animal && (
                <div>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: "var(--ink-600)",
                      margin: "0 0 16px",
                    }}
                  >
                    This information is automatically loaded after selecting the animal.
                  </p>

                  <div
                    style={{
                      background: "var(--cream-50)",
                      borderRadius: 12,
                      border: "1px solid var(--border-soft)",
                      padding: "16px 18px",
                    }}
                  >
                    <InfoRow label="Animal ID" value={animal.id} />
                    <InfoRow label="Ear Tag" value={animal.earTag || "—"} />
                    <InfoRow label="Breed" value={animal.breed} />
                    <InfoRow label="Sex" value={animal.sex || "—"} />
                    <InfoRow label="Owner" value={animal.owner || animal.farmer} />
                    <InfoRow label="Reception Date" value={formatDate(animal.arrival)} />
                    <InfoRow
                      label="Ante-Mortem Status"
                      value={
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            color: "var(--success-600, #3f6b49)",
                            fontWeight: 600,
                          }}
                        >
                          <Icon size={14}>{IconPaths.check}</Icon>
                          Approved
                        </span>
                      }
                    />
                  </div>
                </div>
              )}

              {/* Switch to manual at bottom */}
              {lookupStatus !== "found" && lookupStatus !== "looking" && (
                <div style={{ textAlign: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-soft)" }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink-600)", marginRight: 8 }}>
                    Animal not in the system?
                  </span>
                  <button
                    className="btn btn-outline"
                    onClick={openManual}
                    style={{
                      padding: "7px 18px",
                      borderRadius: 20,
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    <Icon size={13} style={{ marginRight: 5 }}>{IconPaths.plus}</Icon>
                    Add Manual Entry
                  </button>
                </div>
              )}
            </Panel>
          )}

          {/* ── Manual Entry mode ────────────────────────────────────────── */}
          {mode === "manual" && (
            <Panel
              title="1. Enter Animal Details"
              action={
                <button
                  className="btn btn-outline"
                  onClick={resetForm}
                  style={{ fontSize: 12, padding: "5px 12px" }}
                >
                  <Icon size={12} style={{ marginRight: 4 }}>
                    {IconPaths.arrowLeft}
                  </Icon>
                  Back
                </button>
              }
            >
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-600)",
                  margin: "0 0 16px",
                }}
              >
                Enter the animal's details manually. This bypasses the
                pre-registration and ante-mortem inspection checks.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 16px",
                }}
              >
                <FormField
                  label="Animal ID *"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="e.g. EMR-240726-001"
                  required
                />
                <FormField
                  label="Ear Tag (optional)"
                  value={manualEarTag}
                  onChange={(e) => setManualEarTag(e.target.value)}
                  placeholder="e.g. KE-EMR-0001"
                />
                <FormField
                  label="Breed *"
                  as="select"
                  value={manualBreed}
                  onChange={(e) => setManualBreed(e.target.value)}
                >
                  <option value="">— Select breed —</option>
                  {BREED_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </FormField>
                {manualBreed === "Other" && (
                  <FormField
                    label="Specify Breed"
                    value={manualOtherBreed}
                    onChange={(e) => setManualOtherBreed(e.target.value)}
                    placeholder="Enter breed name"
                  />
                )}
                <FormField
                  label="Sex"
                  as="select"
                  value={manualSex}
                  onChange={(e) => setManualSex(e.target.value)}
                >
                  <option value="">— Select sex —</option>
                  {SEX_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </FormField>
                <FormField
                  label="Weight (kg)"
                  type="number"
                  min="1"
                  step="0.1"
                  value={manualWeight}
                  onChange={(e) => setManualWeight(e.target.value)}
                  placeholder="e.g. 400"
                />
              </div>

              <FormField
                label="Owner / Source *"
                value={manualOwner}
                onChange={(e) => setManualOwner(e.target.value)}
                placeholder="e.g. ABC Farm or Farmer Name"
                required
              />

              {/* Ante-mortem override */}
              <div
                style={{
                  marginTop: 4,
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: "1.5px solid var(--border-soft)",
                  background: "var(--cream-50)",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--ink-900)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={anteMortemConfirmed}
                    onChange={(e) => setAnteMortemConfirmed(e.target.checked)}
                    style={{
                      marginTop: 2,
                      width: 16,
                      height: 16,
                      accentColor: "var(--gold-600)",
                    }}
                  />
                  <span>
                    <strong>Ante-mortem inspection confirmed</strong> — I confirm
                    that the animal has been examined and shows no signs of disease,
                    injury, or abnormality that would render it unfit for slaughter.
                  </span>
                </label>
              </div>
            </Panel>
          )}

          {/* ── 2. Slaughter Details ────────────────────────────────────── */}
          {showDetails && (
            <Panel title="2. Slaughter Details">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 16px",
                }}
              >
                <FormField
                  label="Slaughter Date"
                  as="input"
                  type="date"
                  value={slaughterDate}
                  onChange={(e) => setSlaughterDate(e.target.value)}
                />
                <FormField
                  label="Slaughter Time"
                  as="input"
                  type="time"
                  value={slaughterTime}
                  onChange={(e) => setSlaughterTime(e.target.value)}
                />
              </div>

              <FormField
                label="Slaughter Officer"
                value={officerName}
                style={{
                  background: "var(--cream-50)",
                  cursor: "not-allowed",
                  opacity: 0.7,
                }}
                readOnly
              />

              <FormField label="Slaughter Method" as="select" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="">— Select method —</option>
                {SLAUGHTER_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </FormField>

              {method === "Other" && (
                <FormField
                  label="Specify Method"
                  value={otherMethod}
                  onChange={(e) => setOtherMethod(e.target.value)}
                  placeholder="Describe the method used"
                />
              )}

              <FormField label="Slaughter Line / Facility" as="select" value={facility} onChange={(e) => setFacility(e.target.value)}>
                <option value="">— Select line —</option>
                {SLAUGHTER_LINES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </FormField>

              <FormField
                label="Remarks (Optional)"
                as="textarea"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Minor delay during slaughter. Animal showed no abnormalities."
                style={{ minHeight: 80, resize: "vertical" }}
              />
            </Panel>
          )}

          {/* ── 3. Confirmation ─────────────────────────────────────────── */}
          {showDetails && (
            <Panel title="3. Confirmation">
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  cursor: "pointer",
                  fontSize: 13.5,
                  color: "var(--ink-900)",
                }}
              >
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: "var(--gold-600)" }}
                />
                <span>
                  I confirm the slaughter was carried out according to approved
                  procedures.
                </span>
              </label>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 20,
                  paddingTop: 18,
                  borderTop: "1px solid var(--border-soft)",
                }}
              >
                <button
                  className="btn btn-primary"
                  onClick={handleRecord}
                  disabled={!canSubmit}
                >
                  <Icon size={15} style={{ marginRight: 2 }}>
                    {IconPaths.save}
                  </Icon>
                  {saving ? "Recording…" : "Record Slaughter"}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </Panel>
          )}
        </>
      )}
    </>
  );
}

// ─── small helpers ─────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "8px 0",
        borderBottom: "1px solid var(--border-soft)",
        fontSize: 13.5,
      }}
    >
      <span style={{ color: "var(--ink-600)", fontWeight: 500 }}>{label}</span>
      <span style={{ color: "var(--ink-900)", fontWeight: 600, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function StatusBanner({ type, message }) {
  const isError = type === "error";
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        background: isError ? "var(--rust-50, #fef2f2)" : "var(--cream-50)",
        border: `1px solid ${isError ? "var(--rust-600)" : "var(--gold-600)"}`,
        color: isError ? "var(--rust-600)" : "var(--ink-900)",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <Icon size={16}>{isError ? IconPaths.warning : IconPaths.info}</Icon>
      <span>{message}</span>
    </div>
  );
}
