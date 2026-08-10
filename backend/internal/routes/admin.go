package routes

import (
	"net/http"

	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/services"
	"backend/internal/utils"
)

// AdminRoutes registers admin routes. Authentication happens in the React
// client through Supabase Auth; this server only verifies its access tokens.
func AdminRoutes(mux *http.ServeMux, verifier *utils.JWKSVerifier, db *database.DB) {
	authHandler := handlers.NewAdminAuthHandler()
	dashboardHandler := handlers.NewAdminDashboardHandler(services.NewAdminService(db))

	// Kept temporarily so older clients receive a useful migration response.
	mux.HandleFunc("POST /api/admin/login", authHandler.Login)
	mux.HandleFunc("POST /api/admin/refresh", authHandler.RefreshToken)

	requireAdmin := func(handler http.Handler) http.Handler {
		return middleware.RequireAuth(verifier)(middleware.RequireAdmin(handler))
	}
	requireSuperAdmin := func(handler http.Handler) http.Handler {
		return middleware.RequireAuth(verifier)(middleware.RequireRole("super_admin")(handler))
	}

	mux.Handle("POST /api/admin/logout", requireAdmin(http.HandlerFunc(authHandler.Logout)))
	mux.Handle("GET /api/admin/dashboard/users-summary", requireAdmin(http.HandlerFunc(dashboardHandler.GetUserSummary)))
	mux.Handle("GET /api/admin/dashboard/traceability-summary", requireAdmin(http.HandlerFunc(dashboardHandler.GetTraceabilitySummary)))
	mux.Handle("GET /api/admin/dashboard/charts", requireAdmin(http.HandlerFunc(dashboardHandler.GetCharts)))
	mux.Handle("GET /api/admin/approvals", requireAdmin(http.HandlerFunc(dashboardHandler.GetPendingApprovals)))
	mux.Handle("GET /api/admin/users", requireAdmin(http.HandlerFunc(dashboardHandler.GetRecentRegistrations)))
	mux.Handle("GET /api/admin/activity", requireAdmin(http.HandlerFunc(dashboardHandler.GetRecentActivity)))
	mux.Handle("GET /api/admin/alerts", requireAdmin(http.HandlerFunc(dashboardHandler.GetSystemAlerts)))
	mux.Handle("GET /api/admin/profile", requireAdmin(http.HandlerFunc(dashboardHandler.GetAdminProfile)))
	mux.Handle("GET /api/admin/settings", requireSuperAdmin(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		utils.Success(w, http.StatusOK, "Admin settings retrieved", nil)
	})))
}
