package helper

import (
	"context"
	"errors"
	"net/http"
	"strings"
)

type JWTAuthMiddleware struct {
	Secret      []byte
	ResolveAuth func(context.Context, int64) (AuthInfo, error)
}

func (m *JWTAuthMiddleware) Wrap(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h := strings.TrimSpace(r.Header.Get("Authorization"))
		if !strings.HasPrefix(h, "Bearer ") {
			WriteJSON(w, http.StatusUnauthorized, map[string]any{"ok": false, "error": "missing bearer token"})
			return
		}
		tok := strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
		claims, err := ParseJWT(m.Secret, tok)
		if err != nil {
			WriteJSON(w, http.StatusUnauthorized, map[string]any{"ok": false, "error": "invalid token"})
			return
		}
		auth := AuthInfo{MemberID: claims.Sub, Role: claims.Role}
		if m.ResolveAuth != nil {
			var err error
			auth, err = m.ResolveAuth(r.Context(), claims.Sub)
			if err != nil {
				status := http.StatusServiceUnavailable
				message := "authentication unavailable"
				if errors.Is(err, ErrJWT) {
					status, message = http.StatusUnauthorized, "session expired"
				}
				WriteJSON(w, status, map[string]any{"ok": false, "error": message})
				return
			}
		}
		ctx := WithAuth(r.Context(), auth)
		next(w, r.WithContext(ctx))
	}
}

func RequireRoles(roles ...string) func(http.HandlerFunc) http.HandlerFunc {
	allowed := make([]string, 0, len(roles))
	allowedSet := map[string]struct{}{}
	seen := map[string]struct{}{}
	adminLikeAllowed := false
	for _, role := range roles {
		role = NormalizeRole(role)
		if role == "" {
			continue
		}
		if _, exists := seen[role]; exists {
			continue
		}
		seen[role] = struct{}{}
		allowedSet[role] = struct{}{}
		if role == RoleAdmin {
			adminLikeAllowed = true
		}
		allowed = append(allowed, role)
	}

	errMsg := "forbidden"
	if len(allowed) > 0 {
		errMsg = strings.Join(allowed, "/") + " only"
	}

	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			a, ok := GetAuth(r.Context())
			role := NormalizeRole(a.Role)
			_, roleAllowed := allowedSet[role]
			if !ok || (!roleAllowed && !(adminLikeAllowed && IsAdminLikeRole(role))) {
				WriteJSON(w, http.StatusForbidden, map[string]any{
					"ok":    false,
					"error": errMsg,
				})
				return
			}
			next(w, r)
		}
	}
}

func ForbidRoles(roles ...string) func(http.HandlerFunc) http.HandlerFunc {
	blocked := map[string]struct{}{}
	for _, role := range roles {
		role = NormalizeRole(role)
		if role == "" {
			continue
		}
		blocked[role] = struct{}{}
	}

	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			a, ok := GetAuth(r.Context())
			if ok {
				if _, exists := blocked[NormalizeRole(a.Role)]; exists {
					WriteJSON(w, http.StatusForbidden, map[string]any{
						"ok":    false,
						"error": "forbidden",
					})
					return
				}
			}
			next(w, r)
		}
	}
}
