// src/lib/mockAuth.js
//
// Temporary mock "auth" layer, used until the backend team delivers real
// endpoints (see the USE_MOCK toggle in your API layer) and/or the
// AuthContext/Supabase wiring is complete. Remembers which role and
// display name an identifier (email or phone) signed up under, plus who
// is currently "logged in", so dashboards can render without a full
// context provider yet.
//
// Swap this out later for real Supabase auth — the exported function
// names/shapes here are what call sites depend on, not the storage
// mechanism underneath.

const STORAGE_KEY = 'beeftrace_mock_users';
const SESSION_KEY = 'beeftrace_current_user';

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

// Auto-seed a default slaughterhouse user so the UI can be seen without
// going through signup.  Only seeds if no users exist yet.
(function ensureSeedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === '{}') {
      const seed = {};
      seed[normalize('john@slaughters.co.ke')] = { role: 'slaughterhouse', fullname: 'John Mwangi' };
      seed[normalize('0712345678')] = { role: 'slaughterhouse', fullname: 'John Mwangi' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    }
  } catch {
    // ignore
  }
})();

// Call this on successful signup. Registers the identifier(s) the user
// signed up with against their role and display name. Pass whichever of
// email/phone the signup form actually collected — omit the other.
export function registerMockUser({ email, phone, role, fullname }) {
  const store = readStore();
  const record = { role, fullname: fullname || '' };
  if (email) store[normalize(email)] = record;
  if (phone) store[normalize(phone)] = record;
  writeStore(store);
}

// Call this on login submit. Returns the role string for a known
// identifier, or null if nothing matches (typo, or never signed up).
// Kept for backwards compatibility — prefer setCurrentMockUser below,
// which does this same lookup and also opens the session.
export function findMockUserRole(identifier) {
  const store = readStore();
  const record = store[normalize(identifier)];
  return record ? record.role : null;
}

// Call this right after a successful login OR signup. Looks the
// identifier up and, if found, marks them as the active session so
// DashboardRoute can read fullname/role without prop drilling from the
// login form. Returns the matched { role, fullname } record, or null.
export function setCurrentMockUser(identifier) {
  const store = readStore();
  const record = store[normalize(identifier)];
  if (!record) return null;

  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ identifier: normalize(identifier), ...record })
    );
  } catch {
    // ignore — mock layer only
  }
  return record;
}

// Stores only display metadata for a user that Supabase has already
// authenticated. The Supabase client remains the sole owner of tokens.
export function setCurrentAuthenticatedUser(user) {
  const role = user.app_metadata?.role || user.user_metadata?.role || user.user_metadata?.requested_role;
  const record = {
    id: user.id,
    identifier: user.email || user.phone || user.id,
    email: user.email || '',
    phone: user.phone || '',
    role,
    fullname: user.user_metadata?.full_name || user.user_metadata?.fullname || user.email || user.phone || '',
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(record));
  } catch {
    // The Supabase session still exists even if display metadata cannot persist.
  }
  return record;
}

// Returns the currently "logged in" mock user: { identifier, role,
// fullname }, or null if nobody is logged in (e.g. dashboard URL was
// opened directly without going through login/signup).
export function getCurrentMockUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Call this on logout.
export function clearCurrentMockUser() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
