// src/lib/mockAuth.js
//
// Temporary mock "auth" layer, used until the backend team delivers real
// endpoints (see the USE_MOCK toggle in your API layer). All it does is
// remember which role an identifier (email or phone) signed up under, so
// LoginRoute can send them back to the right dashboard.
//
// Swap this out later for a real Supabase lookup — registerMockUser and
// findMockUserRole are the only two functions callers depend on, so the
// call sites in App.jsx won't need to change shape, just implementation.

const STORAGE_KEY = 'beeftrace_mock_users';

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable (private browsing, storage full, etc.) —
    // fail silently, this is a mock layer, not production auth.
  }
}

function normalize(identifier) {
  return (identifier || '').trim().toLowerCase();
}

// Call this on successful signup. Registers the identifier(s) the user
// signed up with against their role. Pass whichever of email/phone the
// signup form actually collected — omit the other.
export function registerMockUser({ email, phone, role }) {
  const store = readStore();
  const record = { role };
  if (email) store[normalize(email)] = record;
  if (phone) store[normalize(phone)] = record;
  writeStore(store);
}

// Call this on login submit. Returns the role string for a known
// identifier, or null if nothing matches (typo, or never signed up).
export function findMockUserRole(identifier) {
  const store = readStore();
  const record = store[normalize(identifier)];
  return record ? record.role : null;
}
