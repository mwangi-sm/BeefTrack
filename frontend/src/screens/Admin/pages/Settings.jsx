import { useState } from "react";
import { DashHead } from "../../../components/DashHead";
import { Panel, LoadingState, ErrorState, EmptyState } from "../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../components/icons";
import { PasswordField } from "../../../signup_screens/SignupKit";
import { useAsync } from "../services/useAdmin";
import { useAdminAuth } from "../context/useAdminAuth";
import {
  updateAdminProfile,
  changeAdminPassword,
  fetchAdminSettings,
  updateAdminSettings,
} from "../services/adminApi";

function InlineNotice({ tone = "error", children }) {
  const isError = tone === "error";
  return (
    <div
      style={{
        background: isError ? "var(--rust-50, #fdeeee)" : "var(--sage-50, #eef7ee)",
        border: `1px solid ${isError ? "var(--rust-600)" : "var(--sage-600, #2f7a3d)"}`,
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 16,
        fontSize: 13,
        color: isError ? "var(--rust-600)" : "var(--sage-600, #2f7a3d)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Icon size={15}>{isError ? IconPaths.warning : IconPaths.check}</Icon>
      {children}
    </div>
  );
}

function AccountSettings() {
  const { admin, refreshAdmin } = useAdminAuth();
  const [fullName, setFullName] = useState(admin?.fullname || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileError("");
    setProfileSaved(false);
    if (!fullName.trim()) {
      setProfileError("Full name is required.");
      return;
    }
    setSavingProfile(true);
    try {
      await updateAdminProfile({ fullName: fullName.trim() });
      await refreshAdmin();
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err.message || "Couldn't update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      await changeAdminPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err.message || "Couldn't update your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <Panel title="My account">
        {profileError && <InlineNotice>{profileError}</InlineNotice>}
        {profileSaved && <InlineNotice tone="success">Profile updated.</InlineNotice>}
        <form onSubmit={handleSaveProfile}>
          <div className="field" style={{ maxWidth: 380 }}>
            <label>Full name</label>
            <input value={fullName} onChange={(e) => { setFullName(e.target.value); setProfileSaved(false); }} />
          </div>
          <div className="field" style={{ maxWidth: 380 }}>
            <label>Email</label>
            <input value={admin?.email || ""} disabled />
          </div>
          <button className="btn btn-primary" type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </form>
      </Panel>

      <Panel title="Change password">
        {passwordError && <InlineNotice>{passwordError}</InlineNotice>}
        {passwordSaved && <InlineNotice tone="success">Password updated.</InlineNotice>}
        <form onSubmit={handleSavePassword}>
          <div className="field" style={{ maxWidth: 380 }}>
            <label>New password</label>
            <PasswordField
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordSaved(false); }}
            />
          </div>
          <div className="field" style={{ maxWidth: 380 }}>
            <label>Confirm new password</label>
            <PasswordField
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordSaved(false); }}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={savingPassword}>
            {savingPassword ? "Saving…" : "Update password"}
          </button>
        </form>
      </Panel>
    </>
  );
}

function PlatformSettings() {
  const { data: settings, loading, error, reload } = useAsync(fetchAdminSettings, []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  // Sync local editable copy whenever fresh data arrives.
  if (settings && form === null) {
    setForm(settings);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    setSaved(false);
    setSaving(true);
    try {
      await updateAdminSettings(form);
      setSaved(true);
      reload();
    } catch (err) {
      setSaveError(err.message || "Couldn't save platform settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Platform settings">
      {loading && <LoadingState label="Loading platform settings" />}
      {!loading && error && (
        <ErrorState
          message={error.status === 501 ? "Platform settings are not available in the current backend." : "Couldn't load platform settings."}
          onRetry={reload}
        />
      )}
      {!loading && !error && !settings && (
        <EmptyState
          icon={IconPaths.gear}
          title="Platform settings aren't connected yet"
          subtitle="This section is wired up to call the backend, but Team 2 hasn't implemented it yet."
        />
      )}
      {!loading && !error && settings && form && (
        <form onSubmit={handleSave}>
          {saveError && <InlineNotice>{saveError}</InlineNotice>}
          {saved && <InlineNotice tone="success">Platform settings saved.</InlineNotice>}

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, marginBottom: 14 }}>
            <input
              type="checkbox"
              checked={!!form.allowNewRegistrations}
              onChange={(e) => setForm((f) => ({ ...f, allowNewRegistrations: e.target.checked }))}
            />
            Allow new stakeholder registrations
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, marginBottom: 18 }}>
            <input
              type="checkbox"
              checked={!!form.maintenanceMode}
              onChange={(e) => setForm((f) => ({ ...f, maintenanceMode: e.target.checked }))}
            />
            Maintenance mode
          </label>

          <div className="field" style={{ maxWidth: 380 }}>
            <label>Support email</label>
            <input
              value={form.supportEmail || ""}
              onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
            />
          </div>

          <div className="field" style={{ maxWidth: 380 }}>
            <label>Support phone</label>
            <input
              value={form.supportPhone || ""}
              onChange={(e) => setForm((f) => ({ ...f, supportPhone: e.target.value }))}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save platform settings"}
          </button>
        </form>
      )}
    </Panel>
  );
}

export function Settings() {
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === "super_admin";

  return (
    <>
      <DashHead
        greeting="Admin control panel"
        title="Settings"
        subtitle="Manage your account and, if you're a super admin, platform-wide settings."
      />

      <AccountSettings />

      {isSuperAdmin && <PlatformSettings />}
    </>
  );
}

export default Settings;
