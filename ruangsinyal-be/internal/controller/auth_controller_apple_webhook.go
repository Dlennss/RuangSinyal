package controller

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"

	"ruangsinyal/internal/helper"
	"ruangsinyal/internal/service"
)

func (h *AuthController) AppleWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		helper.WriteJSON(w, http.StatusMethodNotAllowed, map[string]any{"ok": false})
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<16))
	if err != nil {
		helper.WriteJSON(w, http.StatusOK, map[string]any{"ok": true})
		return
	}

	var payload struct {
		Payload string `json:"payload"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Printf("[apple_webhook] invalid json")
		helper.WriteJSON(w, http.StatusOK, map[string]any{"ok": true})
		return
	}

	event, err := service.VerifyAppleNotification(r.Context(), strings.TrimSpace(payload.Payload))
	if err != nil {
		helper.WriteJSON(w, http.StatusUnauthorized, map[string]any{"ok": false, "error": "invalid apple notification"})
		return
	}
	switch event.Type {
	case "consent-revoked", "account-delete", "account-deleted":
		if err := h.svc.DeactivateAppleMember(r.Context(), event.Sub); err != nil {
			log.Printf("[apple_webhook] deactivation failed: %v", err)
			helper.WriteJSON(w, http.StatusInternalServerError, map[string]any{"ok": false})
			return
		}
	}

	helper.WriteJSON(w, http.StatusOK, map[string]any{"ok": true})
}
