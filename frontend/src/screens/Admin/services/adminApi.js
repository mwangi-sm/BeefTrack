// Compatibility facade for existing Admin UI imports. Domain API calls live
// in src/services/admin/admin.js and all requests share apiClient.js.
export * from "../../../services/admin/admin";

export {
  loginWithSupabase as loginAdmin,
  signOutAdmin as logoutAdmin,
  updateAdminProfile,
  changeAdminPassword,
} from "./adminAuth";
