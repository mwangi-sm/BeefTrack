// Admin service layer — calls the real Go REST API. There is no USE_MOCK
// toggle here on purpose: the Admin Dashboard is spec'd to run against live
// data only. Until Team 2 ships these endpoints, calls below will fail and
// the UI will show its ErrorState / EmptyState — that's expected, not a bug.
//
// Every consuming component talks to this file, never to fetch() directly,
// so swapping paths/response shapes later only means editing here.

import { getAdminToken, broadcastSessionExpired } from "./adminAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/admin`
  : "/api/admin";

async function request(path, options = {}) {
  const token = getAdminToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error("Network error — couldn't reach the BeefTrace API.");
  }

  if (res.status === 401) {
    broadcastSessionExpired();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message || body?.error) message = body.message || body.error;
    } catch {
      // Response wasn't JSON — keep the generic message.
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ───────────────────────── Auth ─────────────────────────

/**
 * @param {{identifier:string, password:string}} credentials
 * @returns {Promise<{token:string, user:{id:string, adminId:string, fullname:string, email:string, role:string}}>}
 */
export async function loginAdmin({ identifier, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

// Verifies the current token against the server and returns the admin's
// profile, or throws (including on an expired/invalid token).
export async function fetchCurrentAdmin() {
  return request("/auth/me");
}

export async function logoutAdmin() {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // Even if the server call fails, the caller still clears local state.
  }
}

// ─────────────────────── Dashboard overview ───────────────────────

/**
 * @returns {Promise<{
 *   totalUsers:number, totalFarmers:number, totalSlaughterhouses:number,
 *   totalSlaughterhouseOfficers:number, totalTransporters:number,
 *   totalDistributors:number, totalProcessors:number, totalRetailers:number
 * }>}
 */
export async function fetchUserSummary() {
  return request("/dashboard/users-summary");
}

/**
 * @returns {Promise<{
 *   animalsRegistered:number, animalsActive:number, animalsTransported:number,
 *   animalsSlaughtered:number, carcassRecords:number, meatBatches:number,
 *   completedChains:number
 * }>}
 */
export async function fetchTraceabilitySummary() {
  return request("/dashboard/traceability-summary");
}

/**
 * @returns {Promise<{
 *   registrationsTrend: Array<{date:string, count:number}>,
 *   roleBreakdown: Array<{name:string, value:number}>
 * }>}
 */
export async function fetchDashboardCharts() {
  return request("/dashboard/charts");
}

/** @returns {Promise<Array<{id:string, name:string, role:string, type:string, submittedAt:string}>>} */
export async function fetchPendingApprovals(limit = 5) {
  return request(`/approvals?status=pending&limit=${limit}`);
}

/** @returns {Promise<Array<{id:string, name:string, role:string, registeredAt:string}>>} */
export async function fetchRecentRegistrations(limit = 5) {
  return request(`/users?sort=recent&limit=${limit}`);
}

/** @returns {Promise<Array<{id:string, text:string, time:string}>>} */
export async function fetchRecentActivity(limit = 8) {
  return request(`/activity?limit=${limit}`);
}

/** @returns {Promise<Array<{id:string, severity:"info"|"warning"|"critical", text:string, time:string}>>} */
export async function fetchSystemAlerts(limit = 5) {
  return request(`/alerts?limit=${limit}`);
}
