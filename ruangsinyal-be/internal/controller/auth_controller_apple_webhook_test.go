package controller

import (
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAppleWebhookRejectsUnsignedDeactivation(t *testing.T) {
	// A nil service ensures an unverified notification cannot reach account mutation.
	ctrl := &AuthController{}
	body := `{"payload":"e30.` + base64.RawURLEncoding.EncodeToString([]byte(`{"type":"account-delete","sub":"not-a-real-user"}`)) + `.fake"}`
	w := httptest.NewRecorder()
	ctrl.AppleWebhook(w, httptest.NewRequest(http.MethodPost, "/v1/webhook/apple", strings.NewReader(body)))
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status=%d want 401", w.Code)
	}
}
