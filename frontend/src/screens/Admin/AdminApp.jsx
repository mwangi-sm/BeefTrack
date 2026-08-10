import { Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthProvider";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";

// Single mount point for the whole Admin Dashboard. Wire it into the main
// app with one route:
//
//   import { AdminApp } from "./screens/Admin/AdminApp";
//   <Route path="/admin/*" element={<AdminApp onToggleTheme={toggleTheme} />} />
//
// `onToggleTheme` is optional — pass it through the same way the other
// dashboards receive it if you want the admin panel to share the app's
// light/dark toggle. See ADMIN_INTEGRATION.md for full setup notes.
export function AdminApp({ onToggleTheme }) {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route
          path="*"
          element={
            <AdminProtectedRoute>
              <AdminDashboard onToggleTheme={onToggleTheme} />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </AdminAuthProvider>
  );
}

export default AdminApp;
