const RESERVED_ROLES = new Set(["admin", "administrator", "super_admin"]);

export const SELF_SERVICE_ROLES = new Set([
  "farmer",
  "veterinary_officer",
  "agent",
  "transporter",
  "slaughterhouse",
  "processor",
  "distributor",
  "retailer",
  "consumer",
]);

function safeRoleFromMetadata(user) {
  const appRole = user?.app_metadata?.role;
  if (appRole) return appRole;

  const requestedRole = user?.user_metadata?.role || user?.user_metadata?.requested_role;
  if (!requestedRole || RESERVED_ROLES.has(requestedRole)) return "";
  return SELF_SERVICE_ROLES.has(requestedRole) ? requestedRole : "";
}

export function buildSignupMetadata(formData) {
  const role = formData.role;
  if (!SELF_SERVICE_ROLES.has(role) || RESERVED_ROLES.has(role)) {
    throw new Error("This role cannot be created through public signup.");
  }

  const fullName =
    formData.fullName ||
    [formData.firstName || formData.contactFirstName, formData.lastName || formData.contactLastName]
      .filter(Boolean)
      .join(" ");

  return {
    role,
    account_status: "active",
    verification_status: "unverified",
    verified: false,
    full_name: fullName,
    phone: formData.phone || "",
    account_type: formData.accountType || "",
  };
}

// Converts a Supabase user into the existing dashboard display shape. It does
// not read or write browser storage and is never used as authentication proof.
export function toAuthenticatedUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    identifier: user.email || user.phone || user.id,
    email: user.email || "",
    phone: user.phone || user.user_metadata?.phone || "",
    role: safeRoleFromMetadata(user),
    accountStatus: user.user_metadata?.account_status || "active",
    verificationStatus: user.user_metadata?.verification_status || "unverified",
    verified: user.user_metadata?.verified === true,
    accountType: user.user_metadata?.account_type || "",
    fullname: user.user_metadata?.full_name || user.user_metadata?.fullname || user.email || user.phone || "",
  };
}
