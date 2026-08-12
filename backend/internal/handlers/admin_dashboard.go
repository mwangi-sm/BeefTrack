package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/models"
	"backend/internal/types"
)

type AdminDashboardHandler struct{}

func NewAdminDashboardHandler() *AdminDashboardHandler {
	return &AdminDashboardHandler{}
}

func (h *AdminDashboardHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	if _, ok := types.AuthClaimsFromContext(r.Context()); !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

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
	_ = json.NewEncoder(w).Encode(stats)
}

func (h *AdminDashboardHandler) GetRecentActivity(w http.ResponseWriter, r *http.Request) {
	activity := []map[string]interface{}{
		{"id": 1, "type": "animal_registered", "message": "New animal registered with tag XYZ123", "created_at": time.Now().Add(-2 * time.Hour)},
		{"id": 2, "type": "organization_created", "message": "New slaughterhouse added to the network", "created_at": time.Now().Add(-5 * time.Hour)},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(activity)
}

func (h *AdminDashboardHandler) GetAdminProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := types.AuthClaimsFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	profile := map[string]interface{}{
		"id":        claims.Subject,
		"email":     claims.Email,
		"role":      claims.AppMetadata.Role,
		"is_active": true,
		"source":    "supabase_auth",
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(profile)
}
