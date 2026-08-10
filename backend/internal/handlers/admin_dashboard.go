package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"backend/internal/services"
	"backend/internal/types"
)

type AdminDashboardHandler struct {
	service *services.AdminService
}

func NewAdminDashboardHandler(service *services.AdminService) *AdminDashboardHandler {
	return &AdminDashboardHandler{service: service}
}

func (h *AdminDashboardHandler) writeServiceResponse(w http.ResponseWriter, data any, err error) {
	w.Header().Set("Content-Type", "application/json")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(data)
}

func (h *AdminDashboardHandler) GetUserSummary(w http.ResponseWriter, r *http.Request) {
	h.writeServiceResponse(w, h.service.GetUserSummary())
}

func (h *AdminDashboardHandler) GetTraceabilitySummary(w http.ResponseWriter, r *http.Request) {
	h.writeServiceResponse(w, h.service.GetTraceabilitySummary())
}

func (h *AdminDashboardHandler) GetCharts(w http.ResponseWriter, r *http.Request) {
	h.writeServiceResponse(w, h.service.GetDashboardCharts())
}

func (h *AdminDashboardHandler) GetPendingApprovals(w http.ResponseWriter, r *http.Request) {
	h.writeServiceResponse(w, h.service.GetPendingApprovals(limitFromQuery(r, 5)))
}

func (h *AdminDashboardHandler) GetRecentRegistrations(w http.ResponseWriter, r *http.Request) {
	h.writeServiceResponse(w, h.service.GetRecentRegistrations(limitFromQuery(r, 5)))
}

func (h *AdminDashboardHandler) GetRecentActivity(w http.ResponseWriter, r *http.Request) {
	h.writeServiceResponse(w, h.service.GetActivity(limitFromQuery(r, 8)))
}

func (h *AdminDashboardHandler) GetSystemAlerts(w http.ResponseWriter, r *http.Request) {
	h.writeServiceResponse(w, h.service.GetAlerts(limitFromQuery(r, 5)))
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

func limitFromQuery(r *http.Request, fallback int) int {
	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit <= 0 || limit > 100 {
		return fallback
	}
	return limit
}
