package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/services"
	"backend/internal/types"
)

type AdminDashboardHandler struct {
	overview *services.AdminOverviewService
}

func NewAdminDashboardHandler(overview *services.AdminOverviewService) *AdminDashboardHandler {
	return &AdminDashboardHandler{overview: overview}
}

func (h *AdminDashboardHandler) GetOverview(w http.ResponseWriter, r *http.Request) {
	if _, ok := types.AuthClaimsFromContext(r.Context()); !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	overview, err := h.overview.Get(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unable to load admin overview"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(overview)
}

func (h *AdminDashboardHandler) GetAdminProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := types.AuthClaimsFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"id": claims.Subject, "email": claims.Email, "role": claims.AppMetadata.Role, "source": "supabase_auth"})
}
