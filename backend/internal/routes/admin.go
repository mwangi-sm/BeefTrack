package routes

import (
	"net/http"

	"backend/internal/database"
	"backend/internal/handlers"
	adminhandlers "backend/internal/handlers/admin"
	"backend/internal/middleware"
	adminrepo "backend/internal/repositories/admin"
	"backend/internal/services"
	adminservices "backend/internal/services/admin"
	"backend/internal/utils"
)

func AdminRoutes(mux *http.ServeMux, verifier *utils.JWKSVerifier, db *database.DB) {
	authHandler := handlers.NewAdminAuthHandler()
	dashboardHandler := handlers.NewAdminDashboardHandler(services.NewAdminOverviewService(db))
	adminHandler := adminhandlers.New(adminservices.New(adminrepo.New(db)))
	mux.HandleFunc("POST /api/admin/login", authHandler.Login)
	mux.HandleFunc("POST /api/admin/refresh", authHandler.RefreshToken)
	requireAdmin := func(handler http.Handler) http.Handler {
		return middleware.RequireAuth(verifier)(middleware.RequireAdmin(handler))
	}
	requireSuperAdmin := func(handler http.Handler) http.Handler {
		return middleware.RequireAuth(verifier)(middleware.RequireRole("super_admin")(handler))
	}
	mux.Handle("POST /api/admin/logout", requireAdmin(http.HandlerFunc(authHandler.Logout)))
	mux.Handle("GET /api/admin/overview", requireAdmin(http.HandlerFunc(dashboardHandler.GetOverview)))
	mux.Handle("GET /api/admin/profile", requireAdmin(http.HandlerFunc(dashboardHandler.GetAdminProfile)))
	mux.Handle("GET /api/admin/users", requireAdmin(http.HandlerFunc(adminHandler.Users)))
	mux.Handle("PATCH /api/admin/users/{id}/status", requireAdmin(http.HandlerFunc(adminHandler.UserStatus)))
	mux.Handle("GET /api/admin/organizations", requireAdmin(http.HandlerFunc(adminHandler.Organizations)))
	mux.Handle("PATCH /api/admin/organizations/{id}/status", requireAdmin(http.HandlerFunc(adminHandler.OrganizationStatus)))
	mux.Handle("POST /api/admin/organizations/{id}/verify", requireAdmin(http.HandlerFunc(adminHandler.VerifyOrganization)))
	// Slaughterhouses are organizations with organization_type=slaughterhouse.
	mux.Handle("GET /api/admin/slaughterhouses", requireAdmin(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		q.Set("type", "slaughterhouse")
		r.URL.RawQuery = q.Encode()
		adminHandler.Organizations(w, r)
	})))
	mux.Handle("PATCH /api/admin/slaughterhouses/{id}/status", requireAdmin(http.HandlerFunc(adminHandler.SlaughterhouseStatus)))
	mux.Handle("POST /api/admin/slaughterhouses/{id}/verify", requireAdmin(http.HandlerFunc(adminHandler.VerifySlaughterhouse)))
	mux.Handle("GET /api/admin/approvals", requireAdmin(http.HandlerFunc(adminHandler.Approvals)))
	mux.Handle("POST /api/admin/approvals/{id}/approve", requireAdmin(http.HandlerFunc(adminHandler.Approve)))
	mux.Handle("POST /api/admin/approvals/{id}/reject", requireAdmin(http.HandlerFunc(adminHandler.Reject)))
	mux.Handle("GET /api/admin/notifications", requireAdmin(http.HandlerFunc(adminHandler.Notifications)))
	mux.Handle("PATCH /api/admin/notifications/{id}/read", requireAdmin(http.HandlerFunc(adminHandler.ReadNotification)))
	mux.Handle("POST /api/admin/notifications/mark-all-read", requireAdmin(http.HandlerFunc(adminHandler.ReadAllNotifications)))
	mux.Handle("GET /api/admin/audit-logs", requireAdmin(http.HandlerFunc(adminHandler.AuditLogs)))
	// No verified report or settings object exists in the supplied schema.
	mux.Handle("GET /api/admin/reports", requireAdmin(adminhandlers.Unavailable("Reports")))
	mux.Handle("GET /api/admin/reports/{reportId}/run", requireAdmin(adminhandlers.Unavailable("Reports")))
	mux.Handle("GET /api/admin/settings", requireSuperAdmin(adminhandlers.Unavailable("Settings")))
	mux.Handle("PATCH /api/admin/settings", requireSuperAdmin(adminhandlers.Unavailable("Settings")))
	// This accepts only animal_receptions.tag_id; animals.id has no verified
	// relationship to receptions and is intentionally not supported here.
	mux.Handle("GET /api/admin/traceability", requireAdmin(http.HandlerFunc(adminHandler.Traceability)))
}
