package service

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"testing"
	"time"
)

func appleTestSigner(t *testing.T) func(map[string]any, string) string {
	t.Helper()
	t.Setenv("APPLE_CLIENT_ID", "test.ruangsinyal")
	t.Setenv("APPLE_CLIENT_IDS", "")
	t.Setenv("APPLE_BUNDLE_ID", "")
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	appleKeysMu.Lock()
	old, oldTime := appleKeysCache, appleKeysCacheTime
	appleKeysCache = &appleJWKS{Keys: []appleJWK{{Kty: "RSA", Kid: "test-key", N: base64.RawURLEncoding.EncodeToString(key.N.Bytes()), E: base64.RawURLEncoding.EncodeToString(big.NewInt(int64(key.E)).Bytes())}}}
	appleKeysCacheTime = time.Now()
	appleKeysMu.Unlock()
	t.Cleanup(func() { appleKeysMu.Lock(); appleKeysCache, appleKeysCacheTime = old, oldTime; appleKeysMu.Unlock() })
	return func(claims map[string]any, alg string) string {
		header, _ := json.Marshal(map[string]string{"alg": alg, "kid": "test-key"})
		body, _ := json.Marshal(claims)
		msg := base64.RawURLEncoding.EncodeToString(header) + "." + base64.RawURLEncoding.EncodeToString(body)
		hash := sha256.Sum256([]byte(msg))
		sig, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, hash[:])
		if err != nil {
			t.Fatal(err)
		}
		return msg + "." + base64.RawURLEncoding.EncodeToString(sig)
	}
}

func TestAppleIdentityValidation(t *testing.T) {
	sign := appleTestSigner(t)
	for _, tc := range []struct {
		name   string
		mutate func(map[string]any)
		alg    string
		valid  bool
	}{
		{"valid", func(map[string]any) {}, "RS256", true},
		{"other app", func(c map[string]any) { c["aud"] = "another.app" }, "RS256", false},
		{"missing audience", func(c map[string]any) { delete(c, "aud") }, "RS256", false},
		{"expired", func(c map[string]any) { c["exp"] = time.Now().Unix() }, "RS256", false},
		{"other issuer", func(c map[string]any) { c["iss"] = "https://invalid.example" }, "RS256", false},
		{"missing subject", func(c map[string]any) { delete(c, "sub") }, "RS256", false},
		{"wrong algorithm", func(map[string]any) {}, "none", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			c := map[string]any{"sub": "apple-test-user", "aud": "test.ruangsinyal", "iss": "https://appleid.apple.com", "exp": time.Now().Add(time.Hour).Unix()}
			tc.mutate(c)
			_, err := verifyAppleIdentityToken(context.Background(), sign(c, tc.alg))
			if (err == nil) != tc.valid {
				t.Fatalf("valid=%v err=%v", tc.valid, err)
			}
		})
	}
	t.Setenv("APPLE_CLIENT_ID", "")
	_, err := verifyAppleIdentityToken(context.Background(), sign(map[string]any{"sub": "user", "aud": "test.ruangsinyal", "iss": "https://appleid.apple.com", "exp": time.Now().Add(time.Hour).Unix()}, "RS256"))
	if err == nil {
		t.Fatal("unconfigured Apple login accepted a token")
	}
}

func TestAppleEmailCannotLinkAnotherAccount(t *testing.T) {
	for _, tc := range []struct {
		name, email, supplied, verified string
		valid                           bool
	}{
		{"verified boolean", "owner@example.test", "owner@example.test", "true", true},
		{"verified string", "Owner@example.test", "", "\"true\"", true},
		{"different account", "owner@example.test", "victim@example.test", "true", false},
		{"unverified", "owner@example.test", "owner@example.test", "false", false},
		{"missing verification", "owner@example.test", "owner@example.test", "", false},
		{"unsigned email only", "", "victim@example.test", "true", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			_, err := verifiedAppleEmail(&appleTokenClaims{Email: tc.email, EmailVerified: json.RawMessage(tc.verified)}, tc.supplied)
			if (err == nil) != tc.valid {
				t.Fatalf("valid=%v err=%v", tc.valid, err)
			}
		})
	}
}

func TestAppleNotificationRequiresSignedNestedEvent(t *testing.T) {
	sign := appleTestSigner(t)
	event := map[string]any{"type": "consent-revoked", "sub": "apple-test-user"}
	raw, _ := json.Marshal(event)
	claims := map[string]any{"iss": "https://appleid.apple.com", "aud": "test.ruangsinyal", "exp": time.Now().Add(time.Hour).Unix(), "events": string(raw)}
	token := sign(claims, "RS256")
	got, err := VerifyAppleNotification(context.Background(), token)
	if err != nil || got.Sub != "apple-test-user" {
		t.Fatalf("event=%v err=%v", got, err)
	}
	claims["events"] = event
	if _, err := VerifyAppleNotification(context.Background(), sign(claims, "RS256")); err != nil {
		t.Fatal(err)
	}
	if _, err := VerifyAppleNotification(context.Background(), token+"invalid"); err == nil {
		t.Fatal("invalid signature accepted")
	}
	delete(claims, "events")
	claims["type"] = "account-delete"
	claims["sub"] = "apple-test-user"
	if _, err := VerifyAppleNotification(context.Background(), sign(claims, "RS256")); err == nil {
		t.Fatal("flat event accepted")
	}
}
