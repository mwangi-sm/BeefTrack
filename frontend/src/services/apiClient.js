import { getSupabase } from "../lib/supabase";

const configuredApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE_URL = configuredApiUrl ? configuredApiUrl.replace(/\/$/, "") : "/api";

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function messageFor(status) {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested record was not found.";
  if (status === 409) return "This action conflicts with the current record state.";
  if (status === 422) return "Some information is invalid. Please review and try again.";
  if (status >= 500) return "The BeefTrace service could not complete the request. Please try again.";
  return "The request could not be completed.";
}

export async function apiRequest(path, options = {}) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  let session = data.session;
  // Do not send an unauthenticated request merely because a tab restored
  // before Supabase finished restoring/rotating its persisted session.
  if (!session?.access_token) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) throw refreshed.error;
    session = refreshed.data.session;
  }
  if (!session?.access_token) {
    throw new ApiError(401, "No active BeefTrace session is available. Please sign in again.");
  }
  async function send(session) {
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${session.access_token}`);
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (import.meta.env.DEV) {
      // Intentionally do not log the credential itself.
      console.debug(`[BeefTrace API] Bearer token attached: ${path}`);
    }
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  }

  let response;
  try {
    response = await send(session);
    // A stored browser token can predate a Supabase signing-key rotation.
    // Refresh it once before surfacing 401; never retry other failures or
    // loop indefinitely.
    if (response.status === 401 && session.refresh_token) {
      const refreshed = await supabase.auth.refreshSession();
      if (!refreshed.error && refreshed.data.session?.access_token) {
        response = await send(refreshed.data.session);
      }
    }
  } catch (cause) {
    throw new ApiError(0, "Unable to reach the BeefTrace API. Check your connection and try again.", cause);
  }
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, body?.message || body?.error || messageFor(response.status), body);
  }
  return body?.success === true && Object.hasOwn(body, "data") ? body.data : body;
}
