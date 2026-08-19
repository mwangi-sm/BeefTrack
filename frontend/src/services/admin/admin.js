import { ApiError, apiRequest } from "../apiClient";
import { broadcastSessionExpired } from "../../screens/Admin/services/adminAuth";

async function request(path, options) {
  try {
    return await apiRequest(`/admin${path}`, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) broadcastSessionExpired();
    throw error;
  }
}

function query(filters, keys) {
  const params = new URLSearchParams();
  for (const key of keys) {
    if (filters[key] !== undefined && filters[key] !== "" && filters[key] !== false) params.set(key, String(filters[key]));
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

export const fetchAdminOverview = () => request("/overview");
export const fetchCurrentAdmin = () => request("/profile");
export const fetchAdminUsers = (filters = {}) => request(`/users${query(filters, ["role", "status", "search", "page", "pageSize"])}`);
export const updateUserStatus = (id, status) => request(`/users/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const fetchAdminOrganizations = (filters = {}) => request(`/organizations${query(filters, ["type", "status", "search", "page", "pageSize"])}`);
export const updateOrganizationStatus = (id, status) => request(`/organizations/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const verifyOrganization = (id) => request(`/organizations/${encodeURIComponent(id)}/verify`, { method: "PATCH" });
export const fetchAdminSlaughterhouses = (filters = {}) => request(`/slaughterhouses${query(filters, ["status", "search", "page", "pageSize"])}`);
export const updateSlaughterhouseStatus = (id, status) => request(`/slaughterhouses/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const verifySlaughterhouse = (id) => request(`/slaughterhouses/${encodeURIComponent(id)}/verify`, { method: "PATCH" });
export const fetchAnimalTraceability = (tag) => request(`/traceability?${new URLSearchParams({ tag })}`);
export const fetchAdminApprovals = (filters = {}) => request(`/approvals${query(filters, ["status", "entityType", "page", "pageSize"])}`);
export const approveRequest = (id) => request(`/approvals/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) });
export const rejectRequest = (id, reason) => request(`/approvals/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: "rejected", reason: reason || "" }) });
export const fetchAuditLogs = (filters = {}) => request(`/audit-logs${query({ page: 1, pageSize: 25, ...filters }, ["actor", "search", "from", "to", "page", "pageSize"])}`);
export const fetchAdminNotifications = (filters = {}) => request(`/notifications${query(filters, ["unreadOnly", "page", "pageSize"])}`);
export const markNotificationRead = (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
export const markAllNotificationsRead = () => request("/notifications/mark-all-read", { method: "POST" });
export const fetchReportCatalog = () => request("/reports");
export const runReport = (id) => request(`/reports/${encodeURIComponent(id)}/run`);
export const fetchAdminSettings = () => request("/settings");
export const updateAdminSettings = (payload) => request("/settings", { method: "PATCH", body: JSON.stringify(payload) });
