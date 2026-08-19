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
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
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
