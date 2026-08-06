import { useContext } from "react";
import { SupabaseSessionContext } from "./supabaseSessionContext";

export function useSupabaseSession() {
  const context = useContext(SupabaseSessionContext);
  if (!context) {
    throw new Error("useSupabaseSession must be used within SupabaseSessionProvider");
  }
  return context;
}
