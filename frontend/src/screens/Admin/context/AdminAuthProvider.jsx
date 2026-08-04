import { useState, useEffect, useCallback } from "react";
import { AdminAuthContext } from "./adminAuthContext";
import { loginAdmin, fetchCurrentAdmin, logoutAdmin } from "../services/adminApi";
import {
  setAdminSession,
  getAdminToken,
  getStoredAdminUser,
  clearAdminSession,
  SESSION_EXPIRED_EVENT,
} from "../services/adminAuth";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const clearSession = useCallback(() => {
    clearAdminSession();
    setAdmin(null);
  }, []);

  // Verify any existing token on load — a token in storage doesn't mean
  // it's still valid, so we always confirm with the server before trusting it.
  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const token = getAdminToken();
      if (!token) {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      // Show the last-known admin immediately so the UI doesn't flash to a
      // login screen while the session check happens in the background.
      const cached = getStoredAdminUser();
      if (cached && !cancelled) setAdmin(cached);

      try {
        const fresh = await fetchCurrentAdmin();
        if (!cancelled) setAdmin(fresh);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // React to 401s raised anywhere in adminApi.js.
  useEffect(() => {
    function handleExpired() {
      clearSession();
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [clearSession]);

  async function login(identifier, password, remember = false) {
    const result = await loginAdmin({ identifier, password });
    if (!result?.token || !result?.user) {
      throw new Error("Unexpected response from the server.");
    }
    if (result.user.role !== "admin") {
      throw new Error("This account does not have admin access.");
    }
    setAdminSession(result.token, result.user, remember);
    setAdmin(result.user);
    return result.user;
  }

  async function logout() {
    await logoutAdmin();
    clearSession();
  }

  const value = {
    admin,
    isAuthenticated: !!admin,
    isAdmin: admin?.role === "admin",
    checkingSession,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
