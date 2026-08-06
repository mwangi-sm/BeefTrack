import { getSupabase } from "./supabase";

// All requests to protected backend routes must pass through this helper so
// they carry the current Supabase access token after refresh/rotation.
export async function authorizedFetch(input, options = {}) {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) {
    throw new Error("Authentication required. Please sign in again.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  return fetch(input, { ...options, headers });
}
