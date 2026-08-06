import { getSupabase, isEmail } from "../../../lib/supabase";

// These keys were used by the retired backend-issued token flow. Clear them
// defensively, but store no Supabase token ourselves.
const LEGACY_TOKEN_KEY = "beef_trace_admin_token";
const LEGACY_USER_KEY = "beef_trace_admin_user";

function toAdmin(user) {
  return {
    id: user.id,
    email: user.email || "",
    fullname: user.user_metadata?.full_name || user.user_metadata?.fullname || user.email || "",
    role: user.app_metadata?.role || "",
  };
}

function isAdminRole(role) {
  return role === "admin" || role === "super_admin";
}

export async function loginWithSupabase(identifier, password) {
  const value = identifier.trim();
  const credentials = isEmail(value)
    ? { email: value, password }
    : { phone: value, password };
  const { data, error } = await getSupabase().auth.signInWithPassword(credentials);
  if (error) throw error;
  if (!data.session || !data.user) {
    throw new Error("Sign-in succeeded, but no active Supabase session was returned.");
  }

  const admin = toAdmin(data.user);
  if (!isAdminRole(admin.role)) {
    await getSupabase().auth.signOut();
    throw new Error("This account does not have administrator access.");
  }
  return { token: data.session.access_token, user: admin };
}

export async function getAdminToken() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session?.access_token || null;
}

export async function getStoredAdminUser() {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) return null;
  const admin = toAdmin(data.user);
  return isAdminRole(admin.role) ? admin : null;
}

export function clearAdminSession() {
  window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  window.sessionStorage.removeItem(LEGACY_USER_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_USER_KEY);
}

export async function signOutAdmin() {
  try {
    await getSupabase().auth.signOut();
  } finally {
    clearAdminSession();
  }
}

export const SESSION_EXPIRED_EVENT = "beef_trace_admin_session_expired";

export function broadcastSessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
