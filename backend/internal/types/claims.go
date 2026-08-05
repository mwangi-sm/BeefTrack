package types

import (
	"context"
	"encoding/json"
	"time"
)

// SupabaseClaims is the subset of a Supabase access token used by this API.
// app_metadata is assigned by trusted server-side code, unlike user_metadata.
type SupabaseClaims struct {
	Issuer      string      `json:"iss"`
	Subject     string      `json:"sub"`
	Audience    Audience    `json:"aud"`
	ExpiresAt   int64       `json:"exp"`
	NotBefore   int64       `json:"nbf,omitempty"`
	IssuedAt    int64       `json:"iat,omitempty"`
	Email       string      `json:"email"`
	AppMetadata AppMetadata `json:"app_metadata"`
}

// AppMetadata contains authorization data managed through the Supabase Admin
// API or a custom access-token hook.
type AppMetadata struct {
	Role string `json:"role"`
}

// Audience accepts the JWT's standard string or string-array representation.
type Audience []string

func (a *Audience) UnmarshalJSON(data []byte) error {
	var single string
	if err := json.Unmarshal(data, &single); err == nil {
		*a = []string{single}
		return nil
	}
	var multiple []string
	if err := json.Unmarshal(data, &multiple); err != nil {
		return err
	}
	*a = multiple
	return nil
}

func (a Audience) Contains(expected string) bool {
	for _, audience := range a {
		if audience == expected {
			return true
		}
	}
	return false
}

// ValidFor checks the registered claims required by this API.
func (c SupabaseClaims) ValidFor(issuer, audience string, now time.Time) bool {
	if c.Issuer != issuer || c.Subject == "" || !c.Audience.Contains(audience) || c.ExpiresAt <= now.Unix() {
		return false
	}
	return c.NotBefore == 0 || c.NotBefore <= now.Unix()
}

type contextKey string

const authClaimsKey contextKey = "supabaseAuthClaims"

// WithAuthClaims returns a context carrying the verified Supabase claims.
func WithAuthClaims(ctx context.Context, claims *SupabaseClaims) context.Context {
	return context.WithValue(ctx, authClaimsKey, claims)
}

// AuthClaimsFromContext retrieves claims attached by RequireAuth.
func AuthClaimsFromContext(ctx context.Context) (*SupabaseClaims, bool) {
	claims, ok := ctx.Value(authClaimsKey).(*SupabaseClaims)
	return claims, ok
}
