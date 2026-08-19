import { Navigate, useLocation } from "react-router-dom";
import { LoadingState } from "../../../components/DashboardBits";
import { useAdminAuth } from "../context/useAdminAuth";

export function AdminProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, checkingSession } = useAdminAuth();
  const location = useLocation();

  if (checkingSession) {
    return (
      <div style={{ padding: "80px 0" }}>
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
