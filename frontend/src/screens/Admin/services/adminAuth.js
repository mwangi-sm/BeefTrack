// Token / session persistence for the Admin Dashboard.
// Real auth only — no mock fallback. Talks to the Go REST API via adminApi.js.
//
// The token lives in sessionStorage by default (cleared when the tab closes,
// which shrinks the window for token theft via XSS). Checking "Keep me
// signed in" on the login screen persists it to localStorage instead.

const TOKEN_KEY = "beef_trace_admin_token";
const USER_KEY = "beef_trace_admin_user";

function storageFor(remember) {
  return remember ? window.localStorage : window.sessionStorage;
}

export function setAdminSession(token, user, remember = false) {
  clearAdminSession();
  const store = storageFor(remember);
  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));
}

export function getAdminToken() {
  return (
    window.sessionStorage.getItem(TOKEN_KEY) ||
    window.localStorage.getItem(TOKEN_KEY)
  );
}

export function getStoredAdminUser() {
  const raw =
    window.sessionStorage.getItem(USER_KEY) ||
    window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

// Fired by adminApi.js whenever a request comes back 401, so whichever
// AdminAuthProvider is mounted can react without adminApi.js needing to
// import React Router or hold component state itself.
export const SESSION_EXPIRED_EVENT = "beef_trace_admin_session_expired";

export function broadcastSessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
