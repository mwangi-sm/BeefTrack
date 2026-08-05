package utils

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"backend/internal/types"
)

var ErrInvalidToken = errors.New("invalid or expired token")

const jwksCacheTTL = 10 * time.Minute

// JWKSVerifier verifies Supabase-issued ES256 access tokens using the public
// keys advertised by the project's JWKS endpoint. It never holds a signing key
// and cannot create JWTs.
type JWKSVerifier struct {
	jwksURL  string
	issuer   string
	audience string
	client   *http.Client

	mu        sync.RWMutex
	keys      map[string]*ecdsa.PublicKey
	fetchedAt time.Time
}

// NewJWKSVerifier creates a verifier for one Supabase project.
func NewJWKSVerifier(jwksURL, issuer string) (*JWKSVerifier, error) {
	if jwksURL == "" || issuer == "" {
		return nil, errors.New("JWKS URL and issuer are required")
	}
	return &JWKSVerifier{
		jwksURL:  jwksURL,
		issuer:   issuer,
		audience: "authenticated",
		client:   &http.Client{Timeout: 5 * time.Second},
		keys:     make(map[string]*ecdsa.PublicKey),
	}, nil
}

// Verify validates a Supabase access token's ES256 signature and required
// registered claims. Unknown key IDs trigger a JWKS refresh to support key
// rotation without a service restart.
func (v *JWKSVerifier) Verify(ctx context.Context, rawToken string) (*types.SupabaseClaims, error) {
	parts := strings.Split(rawToken, ".")
	if len(parts) != 3 || parts[0] == "" || parts[1] == "" || parts[2] == "" {
		return nil, ErrInvalidToken
	}

	var header struct {
		Algorithm string `json:"alg"`
		KeyID     string `json:"kid"`
	}
	if err := decodeJWTPart(parts[0], &header); err != nil || header.Algorithm != "ES256" || header.KeyID == "" {
		return nil, ErrInvalidToken
	}

	var claims types.SupabaseClaims
	if err := decodeJWTPart(parts[1], &claims); err != nil || !claims.ValidFor(v.issuer, v.audience, time.Now()) {
		return nil, ErrInvalidToken
	}

	key, err := v.keyFor(ctx, header.KeyID)
	if err != nil {
		return nil, ErrInvalidToken
	}

	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil || len(signature) != 64 {
		return nil, ErrInvalidToken
	}

	hash := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	r := new(big.Int).SetBytes(signature[:32])
	s := new(big.Int).SetBytes(signature[32:])
	if !ecdsa.Verify(key, hash[:], r, s) {
		return nil, ErrInvalidToken
	}

	return &claims, nil
}

func (v *JWKSVerifier) keyFor(ctx context.Context, keyID string) (*ecdsa.PublicKey, error) {
	v.mu.RLock()
	key, fresh := v.keys[keyID], time.Since(v.fetchedAt) < jwksCacheTTL
	v.mu.RUnlock()
	if key != nil && fresh {
		return key, nil
	}

	if err := v.refresh(ctx); err != nil {
		return nil, err
	}

	v.mu.RLock()
	defer v.mu.RUnlock()
	key = v.keys[keyID]
	if key == nil {
		return nil, errors.New("JWT key is not trusted")
	}
	return key, nil
}

func (v *JWKSVerifier) refresh(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.jwksURL, nil)
	if err != nil {
		return err
	}
	resp, err := v.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return errors.New("could not fetch JWKS")
	}

	var document struct {
		Keys []struct {
			KeyType string `json:"kty"`
			Curve   string `json:"crv"`
			KeyID   string `json:"kid"`
			X       string `json:"x"`
			Y       string `json:"y"`
		} `json:"keys"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&document); err != nil {
		return err
	}

	keys := make(map[string]*ecdsa.PublicKey, len(document.Keys))
	for _, jwk := range document.Keys {
		if jwk.KeyType != "EC" || jwk.Curve != "P-256" || jwk.KeyID == "" {
			continue
		}
		x, errX := base64.RawURLEncoding.DecodeString(jwk.X)
		y, errY := base64.RawURLEncoding.DecodeString(jwk.Y)
		if errX != nil || errY != nil {
			continue
		}
		curve := elliptic.P256()
		pub := &ecdsa.PublicKey{Curve: curve, X: new(big.Int).SetBytes(x), Y: new(big.Int).SetBytes(y)}
		if curve.IsOnCurve(pub.X, pub.Y) {
			keys[jwk.KeyID] = pub
		}
	}
	if len(keys) == 0 {
		return errors.New("JWKS contains no P-256 keys")
	}

	v.mu.Lock()
	v.keys = keys
	v.fetchedAt = time.Now()
	v.mu.Unlock()
	return nil
}

func decodeJWTPart(part string, destination interface{}) error {
	decoded, err := base64.RawURLEncoding.DecodeString(part)
	if err != nil {
		return err
	}
	return json.Unmarshal(decoded, destination)
}
