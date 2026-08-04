package routes

import (
	"net/http"

	"backend/internal/handlers"
	"backend/internal/middleware"
)

// AdminRoutes registers all admin-related routes on the provided mux
func AdminRoutes(mux *http.ServeMux) {
	authHandler := handlers.NewAdminAuthHandler()
	dashboardHandler := handlers.NewAdminDashboardHandler()

	// Public admin auth routes
	mux.HandleFunc("POST /api/admin/login", authHandler.Login)
	mux.HandleFunc("POST /api/admin/refresh", authHandler.RefreshToken)

	// Protected admin routes (require authentication)
	mux.Handle("POST /api/admin/logout", middleware.AuthMiddleware(http.HandlerFunc(authHandler.Logout)))

	// Dashboard routes (require authentication)
	mux.Handle("GET /api/admin/dashboard/stats", middleware.AuthMiddleware(http.HandlerFunc(dashboardHandler.GetStats)))
	mux.Handle("GET /api/admin/dashboard/activity", middleware.AuthMiddleware(http.HandlerFunc(dashboardHandler.GetRecentActivity)))
	mux.Handle("GET /api/admin/profile", middleware.AuthMiddleware(http.HandlerFunc(dashboardHandler.GetAdminProfile)))

	// Example of role-restricted route (super_admin only)
	mux.Handle(
		"GET /api/admin/settings",
		middleware.AuthMiddleware(
			middleware.RequireRole("super_admin")(
				http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{"status":"ok","message":"Admin settings retrieved"}`))
				}),
			),
		),
	)
}