package service

import (
	"context"
	"errors"
	"math"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"ruangsinyal/internal/provider"
)

func TestLiveAppProductPrice(t *testing.T) {
	price, fee, max := int64(11703), int64(1000), int64(50000)
	fixed := provider.Pulsa24JamProduct{SKU: "ATF10", PriceType: "FIXED", Active: true, Price: &price}
	if got, err := liveAppProductPrice("ATF10", "FIXED", 1, &fixed); err != nil || got != 11703 {
		t.Fatalf("fixed catalog price must not receive an invented extra P24 fee: %d %v", got, err)
	}
	open := provider.Pulsa24JamProduct{SKU: "DANA", PriceType: "OPEN_AMOUNT", Active: true, AdditionalFee: &fee, MaximumNominal: &max}
	if got, err := liveAppProductPrice("DANA", "OPEN_AMOUNT", 10000, &open); err != nil || got != 1000 {
		t.Fatalf("fee=%d err=%v", got, err)
	}
	if _, err := liveAppProductPrice("DANA", "OPEN_AMOUNT", 50001, &open); err == nil {
		t.Fatal("live maximum ignored")
	}
	for _, p := range []*provider.Pulsa24JamProduct{nil, &open, {SKU: "ATF10", PriceType: "FIXED", Active: true}, {SKU: "ATF10", PriceType: "FIXED", Price: &price}} {
		if _, err := liveAppProductPrice("ATF10", "FIXED", 1, p); !errors.Is(err, ErrAppOrderPriceChanged) {
			t.Fatalf("invalid live data accepted: %v", err)
		}
	}
}

func TestAppPriceArithmetic(t *testing.T) {
	if fee := appOrderPaymentFee("user", 11703); fee != 0 {
		t.Fatalf("wallet checkout has QRIS fee %d", fee)
	}
	if fee := appOrderPaymentFee("guest", 6150); fee != 44 {
		t.Fatalf("guest fee=%d", fee)
	}
	if _, err := addAppPrices(math.MaxInt64, 1); err == nil {
		t.Fatal("overflow accepted")
	}
	if _, err := addAppPrices(10000, -1000); err == nil {
		t.Fatal("negative fee accepted")
	}
	if got := computeAppOrderPaymentFee(math.MaxInt64); got <= 0 {
		t.Fatal("payment fee overflow")
	}
}

// Exercises the authenticated catalog snapshot without calling PAY or modifying a database.
func TestP24LiveCatalogPricingSnapshot(t *testing.T) {
	path := os.Getenv("P24_PRICING_SNAPSHOT_PATH")
	if path == "" {
		t.Skip("P24_PRICING_SNAPSHOT_PATH not set")
	}
	body, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write(body) }))
	defer server.Close()
	client := provider.NewPulsa24JamAdapter(provider.Pulsa24JamConfig{BaseURL: server.URL, APIKey: "test", PIN: "test"})
	items, err := client.Products(context.Background(), "")
	if err != nil || len(items) == 0 {
		t.Fatal("invalid snapshot", err)
	}
	quotes := 0
	for _, item := range items {
		qty := int64(1)
		if item.PriceType == "OPEN_AMOUNT" {
			qty = 10000
			if item.MaximumNominal != nil && *item.MaximumNominal > 0 && *item.MaximumNominal < qty {
				qty = *item.MaximumNominal
			}
		}
		base, err := liveAppProductPrice(item.SKU, item.PriceType, qty, &item)
		if err != nil {
			t.Fatalf("%s: %v", item.SKU, err)
		}
		if base != Pulsa24JamCatalogItemFromProduct(item).Price {
			t.Fatalf("sync/checkout mismatch %s", item.SKU)
		}
		for _, markup := range []int64{0, 100, 500, 1000} {
			total := base
			if item.PriceType == "OPEN_AMOUNT" {
				total, err = addAppPrices(total, qty)
				if err != nil {
					t.Fatal(err)
				}
			}
			total, err = addAppPrices(total, markup)
			if err != nil || appOrderPaymentFee("user", total) != 0 {
				t.Fatalf("%s invalid wallet total", item.SKU)
			}
			if _, err = addAppPrices(total, appOrderPaymentFee("guest", total)); err != nil {
				t.Fatal(err)
			}
			quotes++
		}
	}
	t.Logf("Verified %d catalog products and %d price/fee scenarios without PAY", len(items), quotes)
}
