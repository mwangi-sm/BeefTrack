import { createClient } from "@supabase/supabase-js";

let client;

export function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_KEY;

  if (
    !url ||
    !key ||
    url.includes("your-project.supabase.co") ||
    key.includes("your_project_key")
  ) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY.",
    );
  }

  if (!client) {
    client = createClient(url, key);
  }
  return client;
}

export function isEmail(identifier) {
  return identifier.includes("@");
}
