package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"ruangsinyal/internal/provider"
	"ruangsinyal/internal/repository"
)

func TestCallAppOrderProviderPulsa24JamCaseInsensitive(t *testing.T) {
	for _, name := range []string{"pulsa24jam", "Pulsa24Jam", " PULSA24JAM "} {
		for _, product := range []struct {
			sku string
			qty int64
		}{{"GOPAY", 100000}, {"UDGP10", 1}} {
			t.Run(name+"/"+product.sku, func(t *testing.T) {
				var received provider.Pulsa24JamPayRequest
				calls := 0
				server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					calls++
					if r.Method != http.MethodPost || r.URL.Path != "/v2/trx" || r.Header.Get("X-Api-Key") != "test-key" {
						t.Errorf("unexpected P24 request: %s %s", r.Method, r.URL.Path)
					}
					if err := json.NewDecoder(r.Body).Decode(&received); err != nil {
						t.Error(err)
					}
					w.Header().Set("Content-Type", "application/json")
					_, _ = w.Write([]byte(`{"ok":true,"status":"pending","price":101200}`))
				}))
				defer server.Close()
				client := provider.NewPulsa24JamAdapter(provider.Pulsa24JamConfig{BaseURL: server.URL + "/v2/trx", APIKey: "test-key", PIN: "test-pin"})
				svc := NewAppOrderFulfillmentService(nil, nil, nil, nil, nil, nil, client)
				order := &repository.AppOrderRow{InvoiceID: "INV-TEST-ONLY", Dest: "TEST-DEST", Qty: product.qty}
				hs, _, price, _, err := svc.callAppOrderProvider(context.Background(), name, product.sku, product.qty, order)
				if err != nil || hs != 200 || price != 101200 || calls != 1 {
					t.Fatalf("P24 routing failed: status=%d price=%d calls=%d err=%v", hs, price, calls, err)
				}
				if received.Commands != "PAY" || received.Product != product.sku || received.Qty != product.qty || received.RefID != order.InvoiceID || received.Dest != order.Dest {
					t.Fatalf("unexpected payload: %+v", received)
				}
			})
		}
	}
}

func TestCallAppOrderProviderMissingP24ClientDoesNotFallback(t *testing.T) {
	svc := NewAppOrderFulfillmentService(nil, nil, nil, nil, nil, nil)
	_, _, _, _, err := svc.callAppOrderProvider(context.Background(), "pulsa24jam", "GOPAY", 100000, &repository.AppOrderRow{})
	if err == nil || err.Error() != "Pulsa24Jam client belum tersedia" {
		t.Fatalf("unexpected error: %v", err)
	}
}
