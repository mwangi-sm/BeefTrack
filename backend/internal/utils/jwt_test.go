package utils

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestJWKSVerifierAcceptsValidSupabaseES256Token(t *testing.T) {
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	issuer := "https://example.supabase.co/auth/v1"
	server := newTestJWKSServer(t, "test-key", &privateKey.PublicKey)
	defer server.Close()

	verifier, err := NewJWKSVerifier(server.URL, issuer)
	if err != nil {
		t.Fatal(err)
	}
	token := signTestES256Token(t, privateKey, "test-key", map[string]interface{}{
		"iss": issuer, "sub": "7d08d337-8d4c-4b7f-8ff9-f3aa6325f5e1", "aud": "authenticated",
		"exp": time.Now().Add(time.Minute).Unix(), "email": "admin@example.com",
		"app_metadata": map[string]string{"role": "admin"},
	})

	claims, err := verifier.Verify(context.Background(), token)
	if err != nil {
		t.Fatalf("Verify() error = %v", err)
	}
	if claims.Subject == "" || claims.AppMetadata.Role != "admin" {
		t.Fatalf("unexpected claims: %#v", claims)
	}
}

func TestJWKSVerifierRejectsWrongAlgorithmAndExpiredToken(t *testing.T) {
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	issuer := "https://example.supabase.co/auth/v1"
	server := newTestJWKSServer(t, "test-key", &privateKey.PublicKey)
	defer server.Close()
	verifier, err := NewJWKSVerifier(server.URL, issuer)
	if err != nil {
		t.Fatal(err)
	}

	expired := signTestES256Token(t, privateKey, "test-key", map[string]interface{}{
		"iss": issuer, "sub": "user", "aud": "authenticated", "exp": time.Now().Add(-time.Minute).Unix(),
	})
	if _, err := verifier.Verify(context.Background(), expired); err == nil {
		t.Fatal("expired token was accepted")
	}

	wrongAlgorithm := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"HS256","kid":"test-key"}`)) + ".e30.invalid"
	if _, err := verifier.Verify(context.Background(), wrongAlgorithm); err == nil {
		t.Fatal("non-ES256 token was accepted")
	}
}

func newTestJWKSServer(t *testing.T, keyID string, publicKey *ecdsa.PublicKey) *httptest.Server {
	t.Helper()
	pad := func(value []byte) string { return base64.RawURLEncoding.EncodeToString(value) }
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"keys": []map[string]string{{
			"kty": "EC", "crv": "P-256", "kid": keyID,
			"x": pad(publicKey.X.FillBytes(make([]byte, 32))),
			"y": pad(publicKey.Y.FillBytes(make([]byte, 32))),
		}}})
	}))
}

func signTestES256Token(t *testing.T, privateKey *ecdsa.PrivateKey, keyID string, claims map[string]interface{}) string {
	t.Helper()
	header, err := json.Marshal(map[string]string{"alg": "ES256", "kid": keyID, "typ": "JWT"})
	if err != nil {
		t.Fatal(err)
	}
	payload, err := json.Marshal(claims)
	if err != nil {
		t.Fatal(err)
	}
	signingInput := base64.RawURLEncoding.EncodeToString(header) + "." + base64.RawURLEncoding.EncodeToString(payload)
	hash := sha256Sum([]byte(signingInput))
	r, s, err := ecdsa.Sign(rand.Reader, privateKey, hash)
	if err != nil {
		t.Fatal(err)
	}
	signature := append(r.FillBytes(make([]byte, 32)), s.FillBytes(make([]byte, 32))...)
	return signingInput + "." + base64.RawURLEncoding.EncodeToString(signature)
}

func sha256Sum(data []byte) []byte {
	hash := sha256.Sum256(data)
	return hash[:]
}
