package helper

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestJWTMiddlewareUsesCurrentAccountState(t *testing.T) {
	secret := []byte("test-secret-for-session-validation")
	token, _ := MakeJWT(secret, 42, "admin", time.Hour)
	for _, tc := range []struct {
		name, role string
		err        error
		want       int
	}{
		{"revoked account", "", ErrJWT, http.StatusUnauthorized},
		{"demoted admin", "user", nil, http.StatusForbidden},
		{"active admin", "admin", nil, http.StatusOK},
		{"database failure", "", errors.New("database unavailable"), http.StatusServiceUnavailable},
	} {
		t.Run(tc.name, func(t *testing.T) {
			m := JWTAuthMiddleware{Secret: secret, ResolveAuth: func(_ context.Context, id int64) (AuthInfo, error) {
				if id != 42 {
					t.Fatalf("unexpected member %d", id)
				}
				return AuthInfo{MemberID: id, Role: tc.role}, tc.err
			}}
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, "/admin", nil)
			r.Header.Set("Authorization", "Bearer "+token)
			m.Wrap(RequireRoles("admin")(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) }))(w, r)
			if w.Code != tc.want {
				t.Fatalf("status=%d want %d", w.Code, tc.want)
			}
		})
	}
}
