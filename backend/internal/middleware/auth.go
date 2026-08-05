package middleware

import (
	"net/http"
	"strings"

	"backend/internal/types"
	"backend/internal/utils"
)

// RequireAuth verifies a Supabase access token from Authorization: Bearer.
func RequireAuth(verifier *utils.JWKSVerifier) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			headerParts := strings.Fields(r.Header.Get("Authorization"))
			if len(headerParts) != 2 || !strings.EqualFold(headerParts[0], "Bearer") {
				utils.Fail(w, http.StatusUnauthorized, "Authentication required.", "missing or invalid bearer token")
				return
			}

			claims, err := verifier.Verify(r.Context(), headerParts[1])
			if err != nil {
				utils.Fail(w, http.StatusUnauthorized, "Session is invalid or expired.", "invalid token")
				return
			}

			next.ServeHTTP(w, r.WithContext(types.WithAuthClaims(r.Context(), claims)))
		})
	}
}
