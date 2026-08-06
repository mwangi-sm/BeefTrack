import { useEffect, useState } from "react";
import { toAuthenticatedUser } from "../lib/authSession";
import { getSupabase } from "../lib/supabase";
import { SupabaseSessionContext } from "./supabaseSessionContext";

export function SupabaseSessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    let subscription;

    async function restoreSession() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active) setUser(toAuthenticatedUser(data.session?.user));

        const result = supabase.auth.onAuthStateChange((_event, session) => {
          if (active) setUser(toAuthenticatedUser(session?.user));
        });
        subscription = result.data.subscription;
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <SupabaseSessionContext.Provider value={{ user, checkingSession }}>
      {children}
    </SupabaseSessionContext.Provider>
  );
}
