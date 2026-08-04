package middleware

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const (
	// AdminIDKey is the context key for the authenticated admin ID
	AdminIDKey contextKey = "admin_id"
	// AdminRoleKey is the context key for the authenticated admin role
	AdminRoleKey contextKey = "admin_role"
)

// AuthMiddleware validates the Bearer token on incoming requests
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
			http.Error(w, `{"error":"invalid authorization header format"}`, http.StatusUnauthorized)
			return
		}

		token := parts[1]

		// TODO: Replace with real token validation (e.g., JWT verification)
		// For now, we accept any non-empty token and derive a placeholder admin ID.
		adminID, role, ok := validateToken(token)
		if !ok {
			http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), AdminIDKey, adminID)
		ctx = context.WithValue(ctx, AdminRoleKey, role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole restricts access to admins with the specified role
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			adminRole, ok := r.Context().Value(AdminRoleKey).(string)
			if !ok || adminRole != role {
				http.Error(w, `{"error":"forbidden: insufficient permissions"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// GetAdminID extracts the authenticated admin ID from the request context
func GetAdminID(r *http.Request) (int64, bool) {
	id, ok := r.Context().Value(AdminIDKey).(int64)
	return id, ok
}

// GetAdminRole extracts the authenticated admin role from the request context
func GetAdminRole(r *http.Request) (string, bool) {
	role, ok := r.Context().Value(AdminRoleKey).(string)
	return role, ok
}

// validateToken is a placeholder for real token validation logic.
// It should be replaced with JWT verification or a session store lookup.
func validateToken(token string) (int64, string, bool) {
	// TODO: Implement real token validation
	// For demonstration, return a fixed admin ID and role.
	if token == "" {
		return 0, "", false
	}
	return 1, "super_admin", true
}