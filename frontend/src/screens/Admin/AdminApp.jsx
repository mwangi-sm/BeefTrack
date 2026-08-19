import { Navigate, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthProvider";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { AdminDashboard } from "./pages/AdminDashboard";


export function AdminApp({ onToggleTheme }) {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<Navigate to="/login" replace />} />
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
