import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon, IconPaths } from "../../../components/icons";
import { FieldError, PasswordField } from "../../../signup_screens/SignupKit";
import { useAdminAuth } from "../context/useAdminAuth";

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAdminAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Already signed in (e.g. session restored on load) — bounce to the
  // dashboard, or wherever the protected route redirected from.
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || "/admin";
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, location, navigate]);

  function validate() {
    const e = {};
    if (!identifier.trim()) e.identifier = "Email or admin ID is required.";
    if (!password) e.password = "Password is required.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setFormError("");
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      await login(identifier.trim(), password, remember);
      const redirectTo = location.state?.from?.pathname || "/admin";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="screen-signup">
      <div className="signup-top">
        <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
          <Icon>{IconPaths.arrowLeft}</Icon> Back to BeefTrace
        </a>
        <div className="wordmark">
          <span className="stampmark">BT</span>
          BeefTrace
        </div>
      </div>

      <div className="signup-wrap">
        <div className="signup-card">
          <div className="signup-role-badge">
            <Icon size={14}>{IconPaths.gear}</Icon> Admin
          </div>
          <h2>Admin sign in</h2>
          <p>Sign in with your administrator credentials to access the control panel.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email or admin ID</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@beeftrace.co.ke"
                autoComplete="username"
                autoFocus
              />
              {errors.identifier && <FieldError>{errors.identifier}</FieldError>}
            </div>

            <div className="field">
              <label>Password</label>
              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hasError={!!errors.password}
              />
              {errors.password && <FieldError>{errors.password}</FieldError>}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-600)", marginBottom: 18 }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Keep me signed in on this device
            </label>

            {formError && (
              <div style={{
                background: "var(--rust-50, #fdeeee)",
                border: "1px solid var(--rust-600)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "var(--rust-600)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <Icon size={15}>{IconPaths.warning}</Icon>
                {formError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Icon size={16}>{IconPaths.gear}</Icon>
              {submitting ? "Signing in…" : "Sign in to Admin Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
