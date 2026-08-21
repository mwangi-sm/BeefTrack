package middleware

import (
	"net/http"
	"strings"

	"backend/internal/types"
	"backend/internal/utils"
	"log"
)

// RequireAuth verifies a Supabase access token from Authorization: Bearer.
func RequireAuth(verifier *utils.JWKSVerifier) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			headerParts := strings.Fields(header)
			headerPresent := len(headerParts) == 2 && strings.EqualFold(headerParts[0], "Bearer")
			// Safe logging: do not log the token itself.
			log.Printf("auth: %s %s authorization-present=%v", r.Method, r.URL.Path, headerPresent)
			if !headerPresent {
				utils.Fail(w, http.StatusUnauthorized, "Authentication required.", "missing or invalid bearer token")
				return
			}

			claims, err := verifier.Verify(r.Context(), headerParts[1])
			if err != nil {
				log.Printf("auth: %s %s token verification failed: %v", r.Method, r.URL.Path, err)
				utils.Fail(w, http.StatusUnauthorized, "Session is invalid or expired.", "invalid token")
				return
			}

			// Safe to log subject and role (no secret material)
			log.Printf("auth: %s %s token verified subject=%s role=%s", r.Method, r.URL.Path, claims.Subject, claims.AppMetadata.Role)
			next.ServeHTTP(w, r.WithContext(types.WithAuthClaims(r.Context(), claims)))
		})
	}
}
