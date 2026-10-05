package provider

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPulsa24JamProducts(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/v2/trx" {
			t.Fatalf("unexpected request %s %s", r.Method, r.URL.Path)
		}
		if got := r.Header.Get("X-Api-Key"); got != "api-key" {
			t.Fatalf("unexpected API key %q", got)
		}
		var payload Pulsa24JamPayRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Fatal(err)
		}
		if payload.Commands != "PRODUK" || payload.PIN != "1234" || payload.Product != "" {
			t.Fatalf("unexpected payload %#v", payload)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true,"items":[{"id":1,"sku":"ML10","nama":"Mobile Legend 10 Diamond","group_name":"GAME","kategori_nama":"Game","brand_nama":"Mobile Legend","tipe_harga":"FIXED","harga_dasar_app":2500,"aktif":true},{"id":2,"sku":"OFF","nama":"Nonaktif","aktif":false}]}`))
	}))
	defer server.Close()

	adapter := NewPulsa24JamAdapter(Pulsa24JamConfig{
		BaseURL:  server.URL,
		APIKey:   "api-key",
		PIN:      "1234",
		Password: "password",
	})
	items, err := adapter.Products(context.Background(), "")
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 1 || items[0].SKU != "ML10" || items[0].AppBasePrice == nil || *items[0].AppBasePrice != 2500 {
		t.Fatalf("unexpected products %#v", items)
	}
}

func TestPulsa24JamProductsSupportsCommandDataShape(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true,"command":"PRODUK","data":{"products":[{"code":"UDGP10","name":"GoPay 10.000","group":"E-WALLET","category":"E-Money","brand":"GoPay","type":"FIXED","price":12000,"status":"ACTIVE"}]}}`))
	}))
	defer server.Close()

	adapter := NewPulsa24JamAdapter(Pulsa24JamConfig{BaseURL: server.URL, APIKey: "api-key", PIN: "1234", Password: "password"})
	items, err := adapter.Products(context.Background(), "UDGP10")
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 1 || items[0].SKU != "UDGP10" || items[0].Price == nil || *items[0].Price != 12000 || !items[0].Active {
		t.Fatalf("unexpected products %#v", items)
	}
}

func TestPulsa24JamProductsRejectsEmptyOrFailedResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"ok":false,"msg":"katalog gagal"}`))
	}))
	defer server.Close()

	adapter := NewPulsa24JamAdapter(Pulsa24JamConfig{
		BaseURL:  server.URL,
		APIKey:   "api-key",
		PIN:      "1234",
		Password: "password",
	})
	if _, err := adapter.Products(context.Background(), ""); err == nil {
		t.Fatal("expected product request error")
	}
}

func TestPulsa24JamProductsRejectsPartialCatalog(t *testing.T) {
	for _, metadata := range []string{`"total":15084`, `"has_more":true`} {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte(`{"ok":true,` + metadata + `,"items":[{"sku":"DANA","nama":"Dana","aktif":true}]}`))
		}))
		adapter := NewPulsa24JamAdapter(Pulsa24JamConfig{BaseURL: server.URL, APIKey: "key", PIN: "1234"})
		_, err := adapter.Products(context.Background(), "")
		server.Close()
		if err == nil {
			t.Fatalf("partial catalog accepted for %s", metadata)
		}
	}
}

func TestPulsa24JamProductsSelectsExactSKUFromSearchResults(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"ok":true,"items":[{"sku":"ATF50","harga":51000,"tipe_harga":"FIXED"},{"sku":"ATF5","harga":6838,"tipe_harga":"FIXED"},{"sku":"OFF","harga":5000,"aktif":false}]}`))
	}))
	defer server.Close()
	adapter := NewPulsa24JamAdapter(Pulsa24JamConfig{BaseURL: server.URL, APIKey: "test", PIN: "test"})
	items, err := adapter.Products(context.Background(), "ATF5")
	if err != nil || len(items) != 1 || items[0].SKU != "ATF5" || items[0].Price == nil || *items[0].Price != 6838 {
		t.Fatalf("must not buy or quote the first fuzzy search result: %+v %v", items, err)
	}
	for _, sku := range []string{"ATF", "MISSING", "OFF"} {
		if _, err := adapter.Products(context.Background(), sku); err == nil {
			t.Fatalf("accepted unavailable exact SKU %s", sku)
		}
	}
}
