package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/middleware"
	"backend/internal/models"
)

// AdminDashboardHandler handles admin dashboard endpoints
type AdminDashboardHandler struct {
	// TODO: Inject dashboard service dependency here
}

// NewAdminDashboardHandler creates a new AdminDashboardHandler
func NewAdminDashboardHandler() *AdminDashboardHandler {
	return &AdminDashboardHandler{}
}

// GetStats handles GET /api/admin/dashboard/stats
func (h *AdminDashboardHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	adminID, ok := middleware.GetAdminID(r)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	_ = adminID

	// TODO: Replace with real aggregation queries via the dashboard service
	stats := models.DashboardStats{
		TotalAnimals:       1250,
		TotalOrganizations: 48,
		TotalUsers:         320,
		TotalTransactions:  845,
		ActiveAnimals:      980,
		PendingApprovals:   12,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(stats)
}

// GetRecentActivity handles GET /api/admin/dashboard/activity
func (h *AdminDashboardHandler) GetRecentActivity(w http.ResponseWriter, r *http.Request) {
	// TODO: Replace with real activity feed from the dashboard service
	activity := []map[string]interface{}{
		{
			"id":        1,
			"type":      "animal_registered",
			"message":   "New animal registered with tag XYZ123",
			"created_at": time.Now().Add(-2 * time.Hour),
		},
		{
			"id":        2,
			"type":      "organization_created",
			"message":   "New slaughterhouse added to the network",
			"created_at": time.Now().Add(-5 * time.Hour),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(activity)
}

// GetAdminProfile handles GET /api/admin/profile
func (h *AdminDashboardHandler) GetAdminProfile(w http.ResponseWriter, r *http.Request) {
	adminID, ok := middleware.GetAdminID(r)
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// TODO: Replace with real profile lookup from the repository
	profile := models.Admin{
		ID:        adminID,
		Email:     "admin@beeftrace.com",
		FullName:  "System Administrator",
		Role:      "super_admin",
		IsActive:  true,
		CreatedAt: time.Now().AddDate(0, -6, 0),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(profile)
}