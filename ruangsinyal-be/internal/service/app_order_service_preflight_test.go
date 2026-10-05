package service

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"ruangsinyal/internal/provider"
)

type catalogTestTransport func(*http.Request) (*http.Response, error)

func (f catalogTestTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestAppOrderCatalogDeadlineAndError(t *testing.T) {
	client := provider.NewPulsa24JamAdapter(provider.Pulsa24JamConfig{BaseURL: "https://provider.invalid/v2/trx", APIKey: "test", PIN: "test"})
	calls := 0
	client.Client.Transport = catalogTestTransport(func(r *http.Request) (*http.Response, error) {
		calls++
		deadline, ok := r.Context().Deadline()
		if !ok || time.Until(deadline) > appOrderCatalogTimeout || time.Until(deadline) < 7*time.Second {
			t.Fatal("catalog request must have its own bounded deadline")
		}
		return nil, context.DeadlineExceeded
	})
	svc := &AppOrderService{Pulsa24JamClient: client}
	item, err := svc.validatePulsa24JamProduct(context.Background(), "DANA")
	if item != nil || !errors.Is(err, ErrAppOrderCatalogUnavailable) || calls != 1 {
		t.Fatalf("unexpected preflight result item=%v err=%v calls=%d", item, err, calls)
	}
	if strings.Contains(err.Error(), "provider.invalid") || !strings.Contains(err.Error(), "saldo belum dipotong") {
		t.Fatal("preflight failure must give a safe, actionable message")
	}
}

func TestAppOrderCatalogPreservesEarlierDeadline(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	want, _ := ctx.Deadline()
	client := provider.NewPulsa24JamAdapter(provider.Pulsa24JamConfig{BaseURL: "https://provider.invalid", APIKey: "test", PIN: "test"})
	client.Client.Transport = catalogTestTransport(func(r *http.Request) (*http.Response, error) {
		got, _ := r.Context().Deadline()
		if got.After(want) {
			t.Fatal("caller deadline was extended")
		}
		return nil, context.DeadlineExceeded
	})
	svc := &AppOrderService{Pulsa24JamClient: client}
	_, err := svc.validatePulsa24JamProduct(ctx, "DANA")
	if !errors.Is(err, ErrAppOrderCatalogUnavailable) {
		t.Fatal(err)
	}
}

func TestAppOrderCatalogSelectsExactLiveDANAProduct(t *testing.T) {
	client := provider.NewPulsa24JamAdapter(provider.Pulsa24JamConfig{BaseURL: "https://provider.invalid", APIKey: "test", PIN: "test"})
	client.Client.Transport = catalogTestTransport(func(r *http.Request) (*http.Response, error) {
		body := `{"ok":true,"items":[{"sku":"DANA10","fee_tambahan":500,"aktif":true},{"sku":"DANA","tipe_harga":"OPEN_AMOUNT","fee_tambahan":1000,"aktif":true}]}`
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
	})
	svc := &AppOrderService{Pulsa24JamClient: client}
	item, err := svc.validatePulsa24JamProduct(context.Background(), "DANA")
	if err != nil || item.SKU != "DANA" || item.AdditionalFee == nil || *item.AdditionalFee != 1000 {
		t.Fatalf("wrong live product: %+v err=%v", item, err)
	}
}
