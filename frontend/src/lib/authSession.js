// Converts a Supabase user into the existing dashboard display shape. It does
// not read or write browser storage and is never used as authentication proof.
export function toAuthenticatedUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    identifier: user.email || user.phone || user.id,
    email: user.email || "",
    phone: user.phone || "",
    role: user.app_metadata?.role || user.user_metadata?.role || user.user_metadata?.requested_role,
    fullname: user.user_metadata?.full_name || user.user_metadata?.fullname || user.email || user.phone || "",
  };
}
