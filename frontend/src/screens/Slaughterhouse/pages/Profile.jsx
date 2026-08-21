import { useState, useEffect, useRef } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { DashHead } from "../../../components/DashHead";
import { Panel, DetailRow, EmptyState, LoadingState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { FormField } from "../components/Formfield";
import { updateProfile, fetchProfile, fetchUserActivityStats } from "../services/slaughterhouseApi";
import { getDocuments, uploadDocument, deleteDocument } from "../services/slaughterhouseApi";
import { useAsync } from "../../Transporter/services/useTransporter";

const chartTooltipStyle = {
  background: "var(--page-bg)",
  border: "1px solid var(--border-soft)",
  borderRadius: 10,
  fontSize: 12,
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const REQUIRED_DOCS = [
  { key: "slaughterhouseLicence", label: "Slaughterhouse Operating Licence" },
  { key: "kebsCertification", label: "KEBS Certification" },
  { key: "healthCert", label: "Public Health Certificate" },
  { key: "foodSafetyCert", label: "Food Safety Management Certificate" },
  { key: "environmentalPermit", label: "Environmental Compliance Permit" },
  { key: "wasteManagementPermit", label: "Waste Management Permit" },
];

const EMPLOYEE_DOCS = [
  { key: "vetCertification", label: "Veterinary Officer Certification" },
  { key: "meatInspectorCert", label: "Meat Inspector Certificate" },
  { key: "staffTrainingCert", label: "Staff Training Certificates" },
];

const OPTIONAL_DOCS = [
  { key: "insuranceCert", label: "Facility Insurance Certificate" },
  { key: "tradeLicence", label: "County Trade Licence" },
  { key: "otherDocs", label: "Other Supporting Documents" },
];

function formatSize(b) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function statusPill(status) {
  const map = {
    verified: { label: "Verified", className: "status-ok" },
    pending_review: { label: "Pending review", className: "status-soon" },
    rejected: { label: "Rejected", className: "status-overdue" },
    expired: { label: "Expired", className: "status-overdue" },
  };
  const m = map[status] || { label: status || "Pending review", className: "status-soon" };
  return <span className={`status-pill ${m.className}`} style={{ fontSize: 10.5 }}>{m.label}</span>;
}

function DocumentRow({ docKey, label, doc, isUploading, onUpload, onDelete, onView, deleteConfirm, setDeleteConfirm }) {
  const hasDoc = doc && (doc.status === "verified" || doc.status === "pending_review");

  return (
    <div style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 14px",
      borderRadius: 10,
      border: "1.5px solid var(--border-soft)",
      background: hasDoc ? "var(--cream-50)" : "var(--page-bg)",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: hasDoc ? "var(--gold-50)" : "var(--cream-100)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={15}>{IconPaths.document}</Icon>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)", display: "flex", alignItems: "center", gap: 6 }}>
          {label}
          {hasDoc ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
            </svg>
          )}
        </div>
        {hasDoc ? (
          <div style={{ fontSize: 11.5, color: "var(--ink-600)", marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{doc.name}</span>
            <span>·</span>
            <span>{formatSize(doc.size)}</span>
            {statusPill(doc.status)}
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 2 }}>Not uploaded</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {hasDoc && (
          <>
            <button className="btn btn-outline" onClick={() => onView(docKey)} style={{ padding: "5px 10px", fontSize: 11.5 }}>View</button>
            <button className="btn btn-outline" onClick={() => setDeleteConfirm(deleteConfirm === docKey ? null : docKey)} style={{ padding: "5px 10px", fontSize: 11.5, minWidth: 30 }}>
              <Icon size={11}>{IconPaths.trash}</Icon>
            </button>
          </>
        )}
        <button
          className="btn btn-primary"
          onClick={() => onUpload(docKey)}
          disabled={isUploading}
          style={{ padding: "5px 10px", fontSize: 11.5 }}
        >
          {isUploading ? "Uploading…" : hasDoc ? "Replace" : "Upload"}
        </button>
      </div>

      {deleteConfirm === docKey && (
        <div style={{
          position: "absolute", right: 10, bottom: -34,
          background: "var(--cream-50)", border: "1px solid var(--rust-600)",
          borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "var(--rust-600)",
          zIndex: 10, display: "flex", gap: 8, alignItems: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          Delete?
          <button className="btn btn-outline" onClick={() => onDelete(docKey)} style={{ padding: "3px 8px", fontSize: 11, color: "var(--rust-600)", borderColor: "var(--rust-600)" }}>Yes</button>
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)} style={{ padding: "3px 8px", fontSize: 11 }}>No</button>
        </div>
      )}
    </div>
  );
}

function DocumentsSection() {
  const { data: serverData, loading, error, reload } = useAsync(getDocuments, []);
  const [documents, setDocuments] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pendingUploadKey, setPendingUploadKey] = useState(null);
  const fileInputRef = useRef(null);

  // Initialise local doc state from server data (one-way sync).
  if (serverData && documents === null) {
    setDocuments(serverData.documents || {});
  }

  // Guard against null during initial render before server data arrives.
  const docs = documents ?? {};

  const allDefs = [...REQUIRED_DOCS, ...EMPLOYEE_DOCS, ...OPTIONAL_DOCS];
  const uploadedCount = allDefs.filter((d) => {
    const doc = docs[d.key];
    return doc && (doc.status === "verified" || doc.status === "pending_review");
  }).length;

  function triggerUpload(key) {
    setPendingUploadKey(key);
    setUploadError(null);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pendingUploadKey) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Please upload a JPG, PNG, WebP, or PDF (max 10MB).");
      setPendingUploadKey(null);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("File must be under 10MB.");
      setPendingUploadKey(null);
      return;
    }

    const key = pendingUploadKey;
    setPendingUploadKey(null);
    setUploading(key);
    setUploadError(null);

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Read failed"));
        reader.readAsDataURL(file);
      });

      const updated = await uploadDocument(key, {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
      });

      setDocuments((prev) => ({ ...prev, [key]: updated }));
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(null);
    }
  }

  async function handleDelete(key) {
    try {
      await deleteDocument(key);
      setDocuments((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setDeleteConfirm(null);
    } catch {
      alert("Failed to delete document.");
      setDeleteConfirm(null);
    }
  }

  function handleView(key) {
    const doc = documents[key];
    if (doc) setPreview({ key, ...doc });
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

      {loading && <Panel title="Documents"><LoadingState label="Loading documents…" /></Panel>}

      {!loading && (
        <>
          {error && (
            <div style={{
              background: "var(--rust-50)", border: "1px solid var(--rust-600)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 12,
              fontSize: 13, color: "var(--rust-600)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon size={15}>{IconPaths.warning}</Icon>
              Couldn't load documents from server — showing offline view.
              <button onClick={reload} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--rust-600)", fontSize: 13, fontWeight: 600 }}>Retry</button>
            </div>
          )}

          {uploadError && (
            <div style={{
              background: "var(--rust-50)", border: "1px solid var(--rust-600)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 12,
              fontSize: 13, color: "var(--rust-600)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon size={15}>{IconPaths.warning}</Icon>
              {uploadError}
              <button onClick={() => setUploadError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--rust-600)", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          )}

          <Panel title="Documents" action={<span style={{ fontSize: 12, color: "var(--ink-600)" }}>{uploadedCount} of {allDefs.length} uploaded</span>}>
            <p style={{ fontSize: 12, color: "var(--ink-600)", margin: "0 0 14px" }}>
              Facility licences, personnel certifications and optional compliance documents.
            </p>

            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-600)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Facility Licences & Certifications
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {REQUIRED_DOCS.map((d) => (
                <DocumentRow
                  key={d.key} docKey={d.key} label={d.label} doc={docs[d.key]}
                  isUploading={uploading === d.key} onUpload={triggerUpload}
                  onDelete={handleDelete} onView={handleView}
                  deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm}
                />
              ))}
            </div>

            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-600)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Personnel Certifications
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {EMPLOYEE_DOCS.map((d) => (
                <DocumentRow
                  key={d.key} docKey={d.key} label={d.label} doc={docs[d.key]}
                  isUploading={uploading === d.key} onUpload={triggerUpload}
                  onDelete={handleDelete} onView={handleView}
                  deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm}
                />
              ))}
            </div>

            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-600)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Optional Documents
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {OPTIONAL_DOCS.map((d) => (
                <DocumentRow
                  key={d.key} docKey={d.key} label={d.label} doc={docs[d.key]}
                  isUploading={uploading === d.key} onUpload={triggerUpload}
                  onDelete={handleDelete} onView={handleView}
                  deleteConfirm={deleteConfirm} setDeleteConfirm={setDeleteConfirm}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Document Status Summary">
            <DetailRow label="Total documents" value={`${uploadedCount} of ${allDefs.length} uploaded`} />
            <DetailRow label="Verified" value={allDefs.filter((d) => docs[d.key]?.status === "verified").length} />
            <DetailRow label="Pending review" value={allDefs.filter((d) => docs[d.key]?.status === "pending_review").length} />
            <DetailRow label="Rejected / Expired" value={allDefs.filter((d) => docs[d.key]?.status === "rejected" || docs[d.key]?.status === "expired").length} />
          </Panel>
        </>
      )}

      {preview && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          onClick={() => setPreview(null)}
        >
          <div
            style={{ background: "var(--cream-50)", borderRadius: 14, maxWidth: 700, width: "100%", maxHeight: "80vh", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: "1px solid var(--border-soft)" }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink-900)" }}>
                  {allDefs.find((d) => d.key === preview.key)?.label || preview.key}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-600)", marginTop: 1 }}>{preview.name} · {formatSize(preview.size)}</div>
              </div>
              <button onClick={() => setPreview(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "var(--ink-600)", padding: "4px 8px", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
              {preview.type === "application/pdf" ? (
                <div style={{ textAlign: "center", color: "var(--ink-600)" }}>
                  <Icon size={40}>{IconPaths.document}</Icon>
                  <p style={{ marginTop: 10, fontSize: 13.5 }}>
                    PDF document —{' '}
                    <a href={preview.dataUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold-600)", fontWeight: 600 }}>open in new tab</a>
                  </p>
                </div>
              ) : (
                <img src={preview.dataUrl} alt={preview.name} style={{ maxWidth: "100%", maxHeight: "55vh", borderRadius: 8, objectFit: "contain" }} />
              )}
            </div>
            <div style={{ padding: "10px 18px", borderTop: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>{statusPill(preview.status)}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {preview.type === "application/pdf" ? (
                  <a href={preview.dataUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: 12, padding: "6px 12px", textDecoration: "none" }}>
                    <Icon size={11}>{IconPaths.download}</Icon> Open PDF
                  </a>
                ) : (
                  <a href={preview.dataUrl} download={preview.name} className="btn btn-outline" style={{ fontSize: 12, padding: "6px 12px", textDecoration: "none" }}>
                    <Icon size={11}>{IconPaths.download}</Icon> Download
                  </a>
                )}
                <button className="btn btn-outline" onClick={() => { setPreview(null); triggerUpload(preview.key); }} style={{ fontSize: 12, padding: "6px 12px" }}>
                  <Icon size={11}>{IconPaths.upload}</Icon> Replace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Profile() {
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [activity, setActivity] = useState(null);
  const [activityStatus, setActivityStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    fetchProfile().then((profile) => {
      if (active) setForm({ fullname: profile.fullName || "", email: profile.email || "", phone: profile.phone || "" });
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActivityStatus("loading");
    fetchUserActivityStats()
      .then((data) => { setActivity(data); setActivityStatus("ready"); })
      .catch(() => setActivityStatus("error"));
  }, []);

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(form);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } finally {
      setSavingProfile(false);
    }
  }

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwSaved(true);
    setCurrent("");
    setNext("");
    setTimeout(() => setPwSaved(false), 2000);
  }

  const hasActivity = (activity?.daily || []).some((d) => d.actions > 0);

  return (
    <>
      <DashHead title="Profile" subtitle="Your authenticated account details." />

      <Panel title="Profile">
        <form onSubmit={handleProfileSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <FormField label="Full name" value={form.fullname} onChange={updateField("fullname")} placeholder="Your full name" />
            <FormField label="Email" type="email" value={form.email} onChange={updateField("email")} placeholder="you@example.com" />
            <FormField label="Phone" type="tel" value={form.phone} onChange={updateField("phone")} placeholder="e.g. 0712 345 678" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button className="btn btn-primary" type="submit" disabled={savingProfile}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.save}</Icon>
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
            {profileSaved && <span style={{ fontSize: 12.5, color: "var(--ink-600)" }}>Saved.</span>}
          </div>
        </form>

      </Panel>

      <Panel title="Your activity this week">
        {activityStatus === "loading" && <LoadingState label="Loading activity…" />}
        {activityStatus === "error" && (
          <EmptyState icon={IconPaths.chartBar} title="Couldn't load activity" subtitle="Try refreshing the page." />
        )}
        {activityStatus === "ready" && !hasActivity && (
          <EmptyState
            icon={IconPaths.chartBar}
            title="No activity logged yet"
            subtitle="Reception, inspection and slaughter actions you record will show up here."
          />
        )}
        {activityStatus === "ready" && hasActivity && (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={activity.daily}>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--ink-600)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--ink-600)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="actions" fill="var(--gold-600)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <DocumentsSection />

      <Panel title="Change password">
        <form onSubmit={handlePasswordSubmit}>
          <FormField type="password" label="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <FormField type="password" label="New password" value={next} onChange={(e) => setNext(e.target.value)} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={!current || !next}>
              <Icon size={15} style={{ marginRight: 2 }}>{IconPaths.check}</Icon>
              Update password
            </button>
            {pwSaved && <span style={{ fontSize: 12.5, color: "var(--ink-600)" }}>Password updated.</span>}
          </div>
        </form>
      </Panel>
    </>
  );
}
