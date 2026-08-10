package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/internal/utils"
)

func TestAdminProtectedRoutesRequireBearerToken(t *testing.T) {
	verifier, err := utils.NewJWKSVerifier("https://project.supabase.co/auth/v1/.well-known/jwks.json", "https://project.supabase.co/auth/v1")
	if err != nil {
		t.Fatal(err)
	}
	mux := http.NewServeMux()
	AdminRoutes(mux, verifier)

	protected := []struct {
		method string
		path   string
	}{
		{method: http.MethodPost, path: "/api/admin/logout"},
		{method: http.MethodGet, path: "/api/admin/dashboard/stats"},
		{method: http.MethodGet, path: "/api/admin/dashboard/activity"},
		{method: http.MethodGet, path: "/api/admin/profile"},
		{method: http.MethodGet, path: "/api/admin/settings"},
	}

	for _, route := range protected {
		t.Run(route.method+" "+route.path, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			mux.ServeHTTP(recorder, httptest.NewRequest(route.method, route.path, nil))
			if recorder.Code != http.StatusUnauthorized {
				t.Fatalf("status = %d, want %d", recorder.Code, http.StatusUnauthorized)
			}
		})
	}
}
