package config

import (
	"fmt"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds shared server settings. Supabase Auth owns user sessions; this
// service only needs public endpoints for verifying access tokens.
type Config struct {
	Port            string
	SupabaseURL     string
	SupabaseKey     string
	SupabaseIssuer  string
	SupabaseJWKSURL string
	AllowedOrigins  []string
}

// Load reads .env (if present) and environment variables. The issuer and JWKS
// endpoint are derived from SUPABASE_URL unless explicitly overridden.
func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		fmt.Println("Notice: No .env file found, falling back to system environment variables.")
	}

	supabaseURL := strings.TrimRight(getEnv("SUPABASE_URL", ""), "/")
	cfg := &Config{
		Port:            getEnv("PORT", "8080"),
		SupabaseURL:     supabaseURL,
		SupabaseKey:     getEnv("SUPABASE_KEY", ""),
		SupabaseIssuer:  getEnv("SUPABASE_JWT_ISSUER", supabaseURL+"/auth/v1"),
		SupabaseJWKSURL: getEnv("SUPABASE_JWKS_URL", supabaseURL+"/auth/v1/.well-known/jwks.json"),
		// Explicit development origins are safe defaults. Deployments must set
		// ALLOWED_ORIGINS to their actual frontend origin(s).
		AllowedOrigins: splitAndTrim(getEnv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")),
	}
	if cfg.SupabaseURL == "" {
		return nil, fmt.Errorf("missing required environment variable: SUPABASE_URL")
	}
	if cfg.SupabaseKey == "" {
		return nil, fmt.Errorf("missing required environment variable: SUPABASE_KEY")
	}
	return cfg, nil
}

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
