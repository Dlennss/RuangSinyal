package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"ruangsinyal/internal/helper"
)

func TestAdminRegisterAuthorization(t *testing.T) {
	t.Setenv("ADMIN_TOKEN", "")
	secret := []byte("admin-register-test-secret")
	auth := &helper.JWTAuthMiddleware{Secret: secret}
	mux := http.NewServeMux()
	AuthRouter(mux, auth.Wrap, nil, secret)

	token := func(role string, ttl time.Duration, key []byte) string {
		t.Helper()
		value, err := helper.MakeJWT(key, 1, role, ttl)
		if err != nil {
			t.Fatal(err)
		}
		return "Bearer " + value
	}
	admin := token("admin", time.Hour, secret)

	tests := []struct {
		name   string
		auth   string
		method string
		body   string
		status int
	}{
		{"anonymous", "", http.MethodPost, `{}`, http.StatusUnauthorized},
		{"invalid token", "Bearer invalid", http.MethodPost, `{}`, http.StatusUnauthorized},
		{"forged admin", token("admin", time.Hour, []byte("wrong-secret")), http.MethodPost, `{}`, http.StatusUnauthorized},
		{"expired admin", token("admin", -time.Hour, secret), http.MethodPost, `{}`, http.StatusUnauthorized},
		{"retail user", token("user", time.Hour, secret), http.MethodPost, `{}`, http.StatusForbidden},
		{"agent", token("agent", time.Hour, secret), http.MethodPost, `{}`, http.StatusForbidden},
		{"staff", token("staff", time.Hour, secret), http.MethodPost, `{}`, http.StatusForbidden},
		{"admin invalid json", admin, http.MethodPost, `{`, http.StatusBadRequest},
		{"admin validation without shared token", admin, http.MethodPost, `{"role":"agent","password":"short"}`, http.StatusBadRequest},
		{"admin get rejected", admin, http.MethodGet, ``, http.StatusMethodNotAllowed},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, "/v1/admin/users/create", strings.NewReader(tc.body))
			if tc.auth != "" {
				req.Header.Set("Authorization", tc.auth)
			}
			res := httptest.NewRecorder()
			mux.ServeHTTP(res, req)
			if res.Code != tc.status {
				t.Fatalf("status = %d, want %d: %s", res.Code, tc.status, res.Body.String())
			}
			if strings.Contains(res.Body.String(), "ADMIN_TOKEN") {
				t.Fatalf("JWT registration must not require a shared token: %s", res.Body.String())
			}
		})
	}
}

func TestLegacyRegisterStillRequiresSharedToken(t *testing.T) {
	t.Setenv("ADMIN_TOKEN", "legacy-test-secret")
	secret := []byte("admin-register-test-secret")
	auth := &helper.JWTAuthMiddleware{Secret: secret}
	mux := http.NewServeMux()
	AuthRouter(mux, auth.Wrap, nil, secret)
	for _, tc := range []struct {
		token  string
		status int
	}{
		{"", http.StatusUnauthorized},
		{"wrong", http.StatusUnauthorized},
		{"legacy-test-secret", http.StatusBadRequest},
	} {
		req := httptest.NewRequest(http.MethodPost, "/v1/auth/register", strings.NewReader(`{`))
		req.Header.Set("X-Admin-Token", tc.token)
		res := httptest.NewRecorder()
		mux.ServeHTTP(res, req)
		if res.Code != tc.status {
			t.Fatalf("status = %d, want %d: %s", res.Code, tc.status, res.Body.String())
		}
	}
}
