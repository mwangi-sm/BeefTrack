package middleware

import (
	"net/http"

	"backend/internal/types"
	"backend/internal/utils"
)

// RequireRole restricts a route to one of the supplied app_metadata.role
// values. It must be mounted after RequireAuth.
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := types.AuthClaimsFromContext(r.Context())
			if !ok || !roleAllowed(claims.AppMetadata.Role, allowedRoles) {
				utils.Fail(w, http.StatusForbidden, "You don't have access to this resource.", "required role is missing")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAdmin permits both standard administrators and super administrators.
func RequireAdmin(next http.Handler) http.Handler {
	return RequireRole("administrator", "super_admin")(next)
}

func roleAllowed(role string, allowedRoles []string) bool {
	for _, allowed := range allowedRoles {
		if role == allowed {
			return true
		}
	}
	return false
}
