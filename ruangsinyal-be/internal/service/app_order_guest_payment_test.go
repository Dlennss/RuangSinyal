package service

import (
	"context"
	"errors"
	"testing"

	"ruangsinyal/internal/repository"
)

func TestGuestOrderRejectsMissingPaymentBeforeDependencies(t *testing.T) {
	for _, key := range []string{"", "change_me", "invalid-key", "SB-Mid-server-test"} {
		t.Run(key, func(t *testing.T) {
			t.Setenv("MIDTRANS_SERVER_KEY", key)
			t.Setenv("MIDTRANS_IS_PRODUCTION", "true")
			// Nil dependencies ensure rejection precedes any database or provider call.
			svc := &AppOrderService{}
			order, err := svc.Create(context.Background(), repository.AppOrderCreateInput{BuyerType: "guest", ProdukID: 1, Dest: "TEST-ONLY", Qty: 1})
			if order != nil || !errors.Is(err, ErrAppOrderGuestPaymentUnavailable) {
				t.Fatalf("order=%v err=%v", order, err)
			}
		})
	}
}

func TestUserOrderDoesNotRequireMidtrans(t *testing.T) {
	t.Setenv("MIDTRANS_SERVER_KEY", "")
	member := int64(1)
	svc := &AppOrderService{}
	_, err := svc.Create(context.Background(), repository.AppOrderCreateInput{BuyerType: "user", MemberID: &member})
	if err == nil || err.Error() != "dest wajib diisi" {
		t.Fatalf("expected normal user validation without Midtrans, got %v", err)
	}
}

func TestConfiguredGuestContinuesValidation(t *testing.T) {
	t.Setenv("MIDTRANS_SERVER_KEY", "SB-Mid-server-unit-test")
	t.Setenv("MIDTRANS_IS_PRODUCTION", "false")
	svc := &AppOrderService{}
	_, err := svc.Create(context.Background(), repository.AppOrderCreateInput{BuyerType: "guest"})
	if err == nil || err.Error() != "dest wajib diisi" {
		t.Fatalf("expected normal guest validation, got %v", err)
	}
}
