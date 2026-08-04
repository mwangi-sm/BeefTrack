package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/models"
)

// AdminAuthHandler handles authentication-related admin endpoints
type AdminAuthHandler struct {
	// TODO: Inject auth service dependency here
}

// NewAdminAuthHandler creates a new AdminAuthHandler
func NewAdminAuthHandler() *AdminAuthHandler {
	return &AdminAuthHandler{}
}

// Login handles POST /api/admin/login
func (h *AdminAuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var creds models.AdminCredentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if creds.Email == "" || creds.Password == "" {
		http.Error(w, `{"error":"email and password are required"}`, http.StatusBadRequest)
		return
	}

	// TODO: Replace with real authentication logic via the auth service
	// For now, return a mock session token.
	session := models.AdminSession{
		Token:     "mock-jwt-token",
		AdminID:   1,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(session)
}

// Logout handles POST /api/admin/logout
func (h *AdminAuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// TODO: Invalidate the session token in the auth service
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "message": "Logged out successfully"})
}

// RefreshToken handles POST /api/admin/refresh
func (h *AdminAuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement token refresh logic
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "message": "Token refreshed"})
}