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
	AdminRoutes(mux, verifier, nil)

	protected := []struct {
		method string
		path   string
	}{
		{method: http.MethodGet, path: "/api/admin/overview"},
		{method: http.MethodGet, path: "/api/admin/profile"},
		{method: http.MethodGet, path: "/api/admin/users"},
		{method: http.MethodPatch, path: "/api/admin/users/user-id/status"},
		{method: http.MethodGet, path: "/api/admin/organizations"},
		{method: http.MethodPatch, path: "/api/admin/organizations/org-id/status"},
		{method: http.MethodPatch, path: "/api/admin/organizations/org-id/verify"},
		{method: http.MethodGet, path: "/api/admin/slaughterhouses"},
		{method: http.MethodPatch, path: "/api/admin/slaughterhouses/slaughterhouse-id/status"},
		{method: http.MethodPatch, path: "/api/admin/slaughterhouses/slaughterhouse-id/verify"},
		{method: http.MethodGet, path: "/api/admin/traceability?query=tag"},
		{method: http.MethodGet, path: "/api/admin/approvals"},
		{method: http.MethodPatch, path: "/api/admin/approvals/approval-id"},
		{method: http.MethodGet, path: "/api/admin/audit-logs"},
		{method: http.MethodGet, path: "/api/admin/notifications"},
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
