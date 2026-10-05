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
					if len(received.RefID) > 20 {
						t.Error("P24 reference exceeded upstream 20-character limit")
					}
					w.Header().Set("Content-Type", "application/json")
					_, _ = w.Write([]byte(`{"ok":true,"status":"pending","price":101200}`))
				}))
				defer server.Close()
				client := provider.NewPulsa24JamAdapter(provider.Pulsa24JamConfig{BaseURL: server.URL + "/v2/trx", APIKey: "test-key", PIN: "test-pin"})
				svc := NewAppOrderFulfillmentService(nil, nil, nil, nil, nil, nil, client)
				order := &repository.AppOrderRow{ID: 2, InvoiceID: "INV-20261005202658-3397AF10", Dest: "TEST-DEST", Qty: product.qty}
				ref, err := appOrderProviderRefID(name, order)
				if err != nil {
					t.Fatal(err)
				}
				hs, _, price, _, err := svc.callAppOrderProvider(context.Background(), name, product.sku, product.qty, order, ref)
				if err != nil || hs != 200 || price != 101200 || calls != 1 {
					t.Fatalf("P24 routing failed: status=%d price=%d calls=%d err=%v", hs, price, calls, err)
				}
				if received.Commands != "PAY" || received.Product != product.sku || received.Qty != product.qty || received.RefID != ref || received.RefID == order.InvoiceID || received.Dest != order.Dest {
					t.Fatalf("unexpected payload: %+v", received)
				}
			})
		}
	}
}

func TestCallAppOrderProviderMissingP24ClientDoesNotFallback(t *testing.T) {
	svc := NewAppOrderFulfillmentService(nil, nil, nil, nil, nil, nil)
	_, _, _, _, err := svc.callAppOrderProvider(context.Background(), "pulsa24jam", "GOPAY", 100000, &repository.AppOrderRow{}, "RSA2")
	if err == nil || err.Error() != "Pulsa24Jam client belum tersedia" {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestP24ProviderReference(t *testing.T) {
	seen := map[string]bool{}
	for _, id := range []int64{1, 2, 35, 36, 100000, 9223372036854775807} {
		order := &repository.AppOrderRow{ID: id, InvoiceID: "INV-20261005202658-3397AF10"}
		ref, err := appOrderProviderRefID("Pulsa24Jam", order)
		if err != nil || len(ref) > 20 || ref == "" || seen[ref] {
			t.Fatalf("invalid or duplicate ref: %s %v", ref, err)
		}
		seen[ref] = true
		again, _ := appOrderProviderRefID("pulsa24jam", order)
		if again != ref {
			t.Fatal("retry reference changed")
		}
		legacy, _ := appOrderProviderRefID("yuscom", order)
		if legacy != order.InvoiceID {
			t.Fatal("unrelated provider reference changed")
		}
	}
	if _, err := appOrderProviderRefID("pulsa24jam", &repository.AppOrderRow{}); err == nil {
		t.Fatal("unsaved order accepted")
	}
}

func TestP24RejectsOversizedReferenceBeforeNetwork(t *testing.T) {
	svc := NewAppOrderFulfillmentService(nil, nil, nil, nil, nil, nil)
	_, _, _, _, err := svc.callAppOrderProvider(context.Background(), "pulsa24jam", "GOPAY", 100000, &repository.AppOrderRow{}, "INV-20261005202658-3397AF10")
	if err == nil || err.Error() != "P24 reference must contain 1 to 20 characters" {
		t.Fatalf("unexpected error: %v", err)
	}
}
