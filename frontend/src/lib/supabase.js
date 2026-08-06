import { createClient } from "@supabase/supabase-js";

let client;

// The publishable key is designed for browser use. Authorization still comes
// from the authenticated user's access token and Supabase RLS/JWKS checks.
export function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (
    !url ||
    !publishableKey ||
    url.includes("your-project.supabase.co") ||
    publishableKey.includes("your_project_key")
  ) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  if (!client) {
    client = createClient(url, publishableKey);
  }
  return client;
}

export function isEmail(identifier) {
  return identifier.includes("@");
}
