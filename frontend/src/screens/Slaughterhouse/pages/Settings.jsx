import { useState } from "react";
import { Panel } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";

export function Settings({ onLogout }) {
  const [prefs, setPrefs] = useState({ email: true, sms: true, push: false });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [saved, setSaved] = useState(false);

  function togglePref(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setPw({ current: "", next: "" });
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <Panel title="Notification preferences">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            ["email", "Email alerts", "Reception, inspection and shipment updates by email"],
            ["sms", "SMS alerts", "Urgent issues — quarantine, delayed shipments, cold room faults"],
            ["push", "Push notifications", "In-app alerts on this device"],
          ].map(([key, label, sub]) => (
            <label
              key={key}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={() => togglePref(key)}
                style={{ marginTop: 3 }}
              />
              <span>
                <span style={{ display: "block", fontWeight: 500, color: "var(--ink-900)" }}>{label}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--ink-600)" }}>{sub}</span>
              </span>
            </label>
          ))}
        </div>
      </Panel>

      <Panel title="Change password">
        <form onSubmit={handleSave} className="sh-form-grid" style={{ maxWidth: 320 }}>
          <label className="sh-form-row">
            Current password
            <input
              type="password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
            />
          </label>
          <label className="sh-form-row">
            New password
            <input
              type="password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
            />
          </label>
          <div className="sh-form-actions" style={{ justifyContent: "flex-start" }}>
            <button className="btn btn-primary" type="submit">
              Update password
            </button>
          </div>
          {saved && <p className="sh-form-note" style={{ color: "var(--gold-600)" }}>Password updated</p>}
        </form>
      </Panel>

      <Panel title="Session">
        <button className="btn btn-outline" onClick={onLogout}>
          <Icon size={15}>{IconPaths.logout}</Icon> Log out
        </button>
      </Panel>
    </>
  );
}