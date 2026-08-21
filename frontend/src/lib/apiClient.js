import { getSupabase } from "./supabase";
export { apiRequest, API_BASE_URL, ApiError } from "../services/apiClient";

// All requests to protected backend routes must pass through this helper so
// they carry the current Supabase access token after refresh/rotation.
export async function authorizedFetch(input, options = {}) {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) {
    if (import.meta.env.DEV) console.debug(`[BeefTrace API] authorizedFetch: no access token for ${input}`);
    throw new Error("Authentication required. Please sign in again.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (import.meta.env.DEV) console.debug(`[BeefTrace API] authorizedFetch: access_token_present=${Boolean(data.session?.access_token)} input=${input}`);
  return fetch(input, { ...options, headers });
}
