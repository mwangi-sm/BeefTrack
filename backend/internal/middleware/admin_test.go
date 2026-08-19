package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/internal/types"
)

func TestRequireAdminAllowsOnlyAdministratorRoles(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	tests := []struct {
		name       string
		role       string
		withClaims bool
		want       int
	}{
		{name: "missing claims", want: http.StatusForbidden},
		{name: "administrator", role: "administrator", withClaims: true, want: http.StatusNoContent},
		{name: "super admin", role: "super_admin", withClaims: true, want: http.StatusNoContent},
		{name: "other role", role: "farmer", withClaims: true, want: http.StatusForbidden},
		{name: "legacy admin role", role: "admin", withClaims: true, want: http.StatusForbidden},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/admin", nil)
			if tt.withClaims {
				req = req.WithContext(types.WithAuthClaims(req.Context(), &types.SupabaseClaims{
					Subject:     "auth-user-id",
					AppMetadata: types.AppMetadata{Role: tt.role},
				}))
			}
			rec := httptest.NewRecorder()
			RequireAdmin(next).ServeHTTP(rec, req)
			if rec.Code != tt.want {
				t.Fatalf("status = %d, want %d", rec.Code, tt.want)
			}
		})
	}
}

func TestRequireRoleRestrictsSuperAdminRoutes(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	for _, tt := range []struct {
		role string
		want int
	}{
		{role: "administrator", want: http.StatusForbidden},
		{role: "super_admin", want: http.StatusNoContent},
	} {
		req := httptest.NewRequest(http.MethodGet, "/admin/settings", nil)
		req = req.WithContext(types.WithAuthClaims(req.Context(), &types.SupabaseClaims{
			Subject:     "auth-user-id",
			AppMetadata: types.AppMetadata{Role: tt.role},
		}))

		recorder := httptest.NewRecorder()
		RequireRole("super_admin")(next).ServeHTTP(recorder, req)
		if recorder.Code != tt.want {
			t.Fatalf("role %q: status = %d, want %d", tt.role, recorder.Code, tt.want)
		}
	}
}
