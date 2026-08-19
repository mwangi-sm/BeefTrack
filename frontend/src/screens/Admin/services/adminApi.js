// Admin service layer — calls the real Go REST API. There is no USE_MOCK
// toggle here on purpose: the Admin Dashboard is spec'd to run against live
// data only. Until Team 2 ships these endpoints, calls below will fail and
// the UI will show its ErrorState / EmptyState — that's expected, not a bug.
//
// Every consuming component talks to this file, never to fetch() directly,
// so swapping paths/response shapes later only means editing here.

import { authorizedFetch } from "../../../lib/apiClient";
import { API_BASE_URL } from "../../../services/apiClient";
import {
  broadcastSessionExpired,
  loginWithSupabase,
  signOutAdmin,
  updateAdminProfile,
  changeAdminPassword,
} from "./adminAuth";

const API_BASE = `${API_BASE_URL}/admin`;

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await authorizedFetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error("Network error — couldn't reach the BeefTrace API.");
  }

  if (res.status === 401) {
    broadcastSessionExpired();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let responseBody = null;
    try {
      responseBody = await res.json();
      if (responseBody?.message || responseBody?.error) message = responseBody.message || responseBody.error;
    } catch {
      // Response wasn't JSON — keep the generic message.
    }
    if (import.meta.env.DEV) {
      console.error("Admin API request failed", { path, status: res.status, response: responseBody });
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  const body = await res.json();
  // New Admin handlers use the backend's standard response envelope. Keep
  // existing raw endpoints (profile and overview) compatible as well.
  return body && body.success === true && Object.prototype.hasOwnProperty.call(body, "data")
    ? body.data
    : body;
}

// ───────────────────────── Auth ─────────────────────────

/**
 * @param {{identifier:string, password:string}} credentials
 * @returns {Promise<{token:string, user:{id:string, adminId:string, fullname:string, email:string, role:string}}>}
 */
export async function loginAdmin({ identifier, password }) {
  return loginWithSupabase(identifier, password);
}

// Verifies the current token against the server and returns the admin's
// profile, or throws (including on an expired/invalid token).
export async function fetchCurrentAdmin() {
  return request("/profile");
}

export async function logoutAdmin() {
  await signOutAdmin();
}

// Self-service account edits — re-exported here so every consuming
// component still only ever imports from adminApi.js. These go straight to
// Supabase Auth (see adminAuth.js) rather than the Go backend, consistent
// with how login/logout already work.
export { updateAdminProfile, changeAdminPassword };

// ─────────────────────── Dashboard overview ───────────────────────

/**
 * @returns {Promise<{
 *   totalUsers:number, totalFarmers:number, totalSlaughterhouses:number,
 *   totalSlaughterhouseOfficers:number, totalTransporters:number,
 *   totalDistributors:number, totalProcessors:number, totalRetailers:number
 * }>}
 */
export async function fetchAdminOverview() {
  return request("/overview");
}

// ───────────────────────── Users ─────────────────────────

/**
 * GET /api/admin/users — list every profile across all roles.
 * Expected to accept optional query filters and return the fields below.
 *
 * @param {{role?:string, status?:string, search?:string, page?:number, pageSize?:number}} [filters]
 * @returns {Promise<Array<{
 *   id:string, fullName:string, email:string, phone:string, role:string,
 *   accountStatus:"active"|"suspended"|"pending", verificationStatus:string,
 *   createdAt:string
 * }>>}
 */
export async function fetchAdminUsers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const query = params.toString();
  const response = await request(`/users${query ? `?${query}` : ""}`);
  return response?.items || response;
}

/**
 * PATCH /api/admin/users/:id/status — suspend or reactivate an account.
 * @param {string} userId
 * @param {"active"|"suspended"} status
 */
export async function updateUserStatus(userId, status) {
  return request(`/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ───────────────────────── Organizations ─────────────────────────

/**
 * GET /api/admin/organizations — list farms, slaughterhouses, distributors,
 * retailers, etc. registered as organizations.
 *
 * @param {{type?:string, status?:string, search?:string}} [filters]
 * @returns {Promise<Array<{
 *   id:string, name:string, type:string, location:string,
 *   status:"active"|"pending"|"suspended", verified:boolean,
 *   memberCount:number, createdAt:string
 * }>>}
 */
export async function fetchAdminOrganizations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  const response = await request(`/organizations${query ? `?${query}` : ""}`);
  return response?.items || response;
}

/**
 * PATCH /api/admin/organizations/:id/status — suspend or reactivate an org.
 * @param {string} orgId
 * @param {"active"|"suspended"} status
 */
export async function updateOrganizationStatus(orgId, status) {
  return request(`/organizations/${orgId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/**
 * POST /api/admin/organizations/:id/verify — mark an organization verified.
 * @param {string} orgId
 */
export async function verifyOrganization(orgId) {
  return request(`/organizations/${orgId}/verify`, { method: "PATCH" });
}

// ───────────────────────── Slaughterhouses ─────────────────────────

/**
 * GET /api/admin/slaughterhouses — list registered slaughterhouses, joined
 * against slaughterhouse_profiles + officer counts.
 *
 * @param {{status?:string, search?:string}} [filters]
 * @returns {Promise<Array<{
 *   id:string, name:string, licenseNumber:string, county:string,
 *   status:"active"|"pending"|"suspended", verified:boolean,
 *   officerCount:number, dailyCapacity:number,
 *   activeReceptions:number, createdAt:string
 * }>>}
 */
export async function fetchAdminSlaughterhouses(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  const response = await request(`/slaughterhouses${query ? `?${query}` : ""}`);
  return response?.items || response;
}

/**
 * PATCH /api/admin/slaughterhouses/:id/status
 * @param {string} slaughterhouseId
 * @param {"active"|"suspended"} status
 */
export async function updateSlaughterhouseStatus(slaughterhouseId, status) {
  return request(`/slaughterhouses/${slaughterhouseId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/**
 * POST /api/admin/slaughterhouses/:id/verify
 * @param {string} slaughterhouseId
 */
export async function verifySlaughterhouse(slaughterhouseId) {
  return request(`/slaughterhouses/${slaughterhouseId}/verify`, { method: "PATCH" });
}

// ───────────────────────── Traceability ─────────────────────────

/**
 * GET /api/admin/traceability?query=... — resolve a BeefTrace ID, RFID tag,
 * or alternative ID to the animal's full farm-to-consumer chain of custody.
 * The backend does all joins/aggregation; the client only renders what
 * comes back.
 *
 * @param {string} query
 * @returns {Promise<{
 *   animal: { id:string, tagId:string, rfid:string, breed:string, gender:string,
 *             dob:string, status:string },
 *   farm: { name:string, owner:string, county:string, subCounty:string } | null,
 *   healthRecords: Array<{ id:string, date:string, weightKg:number, healthStatus:string }>,
 *   vetVisits: Array<{ id:string, date:string, vetName:string, disease:string, treatment:string }>,
 *   transport: Array<{ id:string, tripCode:string, transporter:string, origin:string,
 *                       destination:string, departedAt:string, arrivedAt:string }>,
 *   slaughter: { id:string, slaughterhouse:string, carcassId:string, date:string,
 *                grade:string } | null,
 *   processing: { id:string, processor:string, cutType:string, weightKg:number,
 *                 packagedAt:string, batchCode:string } | null,
 *   distribution: { id:string, distributor:string, shipmentId:string, shippedAt:string,
 *                   status:string } | null,
 *   retail: { id:string, retailer:string, receivedAt:string, verificationStatus:string } | null,
 *   consumerScans: Array<{ id:string, scannedAt:string }>
 * }>}
 */
export async function fetchAnimalTraceability(query) {
  // The verified query starts at animal_receptions.tag_id. animals.id is not
  // accepted because no schema relationship connects it to a reception.
  const params = new URLSearchParams({ tag: query });
  return request(`/traceability?${params.toString()}`);
}

// ───────────────────────── Approvals ─────────────────────────

/**
 * GET /api/admin/approvals — pending (and, optionally, reviewed) approval
 * requests from the admin_approvals table.
 *
 * @param {{status?:string, entityType?:string}} [filters]
 * @returns {Promise<Array<{
 *   id:string, entityType:"organization"|"profile", entityId:string,
 *   name:string, role:string, stakeholderType:string,
 *   submittedAt:string, status:"pending"|"approved"|"rejected",
 *   reviewedBy:string|null, reviewedAt:string|null
 * }>>}
 */
export async function fetchAdminApprovals(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.entityType) params.set("entityType", filters.entityType);
  const query = params.toString();
  const response = await request(`/approvals${query ? `?${query}` : ""}`);
  return response?.items || response;
}

/**
 * POST /api/admin/approvals/:id/approve
 * @param {string} approvalId
 */
export async function approveRequest(approvalId) {
  return request(`/approvals/${approvalId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "approved" }),
  });
}

/**
 * POST /api/admin/approvals/:id/reject
 * @param {string} approvalId
 * @param {string} [reason]
 */
export async function rejectRequest(approvalId, reason) {
  return request(`/approvals/${approvalId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "rejected", reason: reason || "" }),
  });
}

// ───────────────────────── Reports ─────────────────────────

/**
 * GET /api/admin/reports — catalog of available report types. Ideally backed
 * by a `report_types` table so new reports can be added without a redeploy.
 *
 * @returns {Promise<Array<{
 *   id:string, title:string, description:string, category:string
 * }>>}
 */
export async function fetchReportCatalog() {
  return request("/reports");
}

/**
 * GET /api/admin/reports/:reportId/run — executes one report server-side
 * (aggregation happens in SQL, not in the client) and returns tabular data.
 *
 * @param {string} reportId
 * @param {{from?:string, to?:string}} [filters] ISO date strings
 * @returns {Promise<{
 *   columns: Array<{key:string, label:string}>,
 *   rows: Array<Record<string, string|number>>,
 *   generatedAt: string
 * }>}
 */
export async function runReport(reportId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return request(`/reports/${reportId}/run${query ? `?${query}` : ""}`);
}

/**
 * Builds the CSV export URL for a report. The browser navigates to this
 * directly (via an <a> tag) so the server can stream the file with a
 * Content-Disposition header; auth still applies via the session cookie /
 * whatever authorizedFetch normally attaches, so Team 2 should accept the
 * same bearer-token mechanism on this route too.
 *
 * @param {string} reportId
 * @param {{from?:string, to?:string}} [filters]
 * @returns {string}
 */
export function reportDownloadUrl(reportId, filters = {}) {
  const params = new URLSearchParams({ format: "csv" });
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return `${API_BASE}/reports/${reportId}/run?${params.toString()}`;
}

// ───────────────────────── Audit Logs ─────────────────────────

/**
 * GET /api/admin/audit-logs — paginated read of the admin_activity table.
 *
 * @param {{actor?:string, search?:string, from?:string, to?:string, page?:number, pageSize?:number}} [filters]
 * @returns {Promise<{
 *   items: Array<{ id:string, actor:string, actorRole:string, activity:string, createdAt:string }>,
 *   page:number, pageSize:number, total:number
 * }>}
 */
export async function fetchAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.actor) params.set("actor", filters.actor);
  if (filters.search) params.set("search", filters.search);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(filters.page || 1));
  params.set("pageSize", String(filters.pageSize || 25));
  return request(`/audit-logs?${params.toString()}`);
}

// ───────────────────────── Notifications ─────────────────────────

/**
 * GET /api/admin/notifications — read of the admin_notifications table for
 * the signed-in admin.
 *
 * @param {{unreadOnly?:boolean}} [filters]
 * @returns {Promise<Array<{
 *   id:string, type:string, text:string, unread:boolean, createdAt:string
 * }>>}
 */
export async function fetchAdminNotifications(filters = {}) {
  const params = new URLSearchParams();
  if (filters.unreadOnly) params.set("unreadOnly", "true");
  const query = params.toString();
  const response = await request(`/notifications${query ? `?${query}` : ""}`);
  return response?.items || response;
}

/**
 * PATCH /api/admin/notifications/:id/read
 * @param {string} notificationId
 */
export async function markNotificationRead(notificationId) {
  return request(`/notifications/${notificationId}/read`, { method: "PATCH" });
}

/**
 * POST /api/admin/notifications/mark-all-read
 */
export async function markAllNotificationsRead() {
  return request("/notifications/mark-all-read", { method: "POST" });
}

// ───────────────────────── Settings ─────────────────────────

/**
 * GET /api/admin/settings — platform-wide settings. Restricted to
 * super_admin server-side (see requireSuperAdmin in admin.go). Currently a
 * stub returning `data: null` — the frontend renders an EmptyState until
 * Team 2 defines and returns real fields.
 *
 * @returns {Promise<{
 *   allowNewRegistrations:boolean, maintenanceMode:boolean,
 *   supportEmail:string, supportPhone:string
 * } | null>}
 */
export async function fetchAdminSettings() {
  return request("/settings");
}

/**
 * PATCH /api/admin/settings — not yet implemented server-side; only the
 * GET stub exists today. Wired up ahead of time so the Settings page just
 * starts working once Team 2 adds the handler.
 *
 * @param {{allowNewRegistrations?:boolean, maintenanceMode?:boolean,
 *           supportEmail?:string, supportPhone?:string}} payload
 */
export async function updateAdminSettings(payload) {
  return request("/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
