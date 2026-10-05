package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	_ "github.com/lib/pq"
	"ruangsinyal/internal/provider"
	"ruangsinyal/internal/repository"
)

// Opt-in only: use an empty, disposable database with the production schema, never production data.
func TestP24CheckoutIsolatedDatabase(t *testing.T) {
	dsn := os.Getenv("P24_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("P24_TEST_DATABASE_URL is not set")
	}
	logDir := t.TempDir()
	t.Setenv("PULSA_LOG_DIR", logDir)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	var name string
	if err = db.QueryRow("SELECT current_database()").Scan(&name); err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(name, "ruangsinyal_p24_test_") {
		t.Fatal("refusing non-test database")
	}
	var count int
	if err = db.QueryRow("SELECT count(*) FROM member").Scan(&count); err != nil || count != 0 {
		t.Fatal("test database must have no members", err)
	}
	exec := func(q string, args ...any) {
		t.Helper()
		if _, err := db.Exec(q, args...); err != nil {
			t.Fatal(err)
		}
	}
	id := func(q string, args ...any) int64 {
		t.Helper()
		var v int64
		if err := db.QueryRow(q, args...).Scan(&v); err != nil {
			t.Fatal(err)
		}
		return v
	}
	category := id("INSERT INTO kategori(nama,aktif) VALUES('E-Wallet',true) RETURNING id")
	brand := id("INSERT INTO brand(nama,aktif) VALUES('GoPay',true) RETURNING id")
	product := id("INSERT INTO produk(sku,nama,kategori_id,brand_id,tipe_harga,aktif) VALUES('GOPAY','Test GoPay',$1,$2,'OPEN_AMOUNT',true) RETURNING id", category, brand)
	exec("INSERT INTO provider(nama,aktif) VALUES('Pulsa24Jam',true)")
	exec("INSERT INTO produk_provider_map(produk_id,provider,kode_provider,aktif,minimal_nominal) VALUES($1,'Pulsa24Jam','GOPAY',true,1)", product)
	exec("INSERT INTO produk_app_pricing(produk_id,provider,harga,harga_dasar,aktif) VALUES($1,'Pulsa24Jam',1200,1200,true)", product)
	exec("INSERT INTO dompet_provider(provider,saldo) VALUES('pulsa24jam',300000)")
	orders := repository.NewAppOrderRepository(db)
	attempts := repository.NewAppOrderProviderTrxRepository(db)
	callbacks := repository.NewProviderCallbackRepository(db)
	ctx := context.Background()
	for index, final := range []string{"success", "failed"} {
		t.Run(final, func(t *testing.T) {
			member := id("INSERT INTO member(email,nama,role,aktif) VALUES($1,'Synthetic test','user',true) RETURNING id", final+"@example.invalid")
			exec("INSERT INTO dompet_member(member_id,saldo) VALUES($1,198800)", member)
			invoice := fmt.Sprintf("INV-20261005202658-TEST%04d", index)
			err := orders.Create(ctx, repository.AppOrderCreateInput{InvoiceID: invoice, MemberID: &member, ProdukID: product, ProdukSKUSnapshot: "GOPAY", ProdukNamaSnapshot: "Test GoPay", Dest: "TEST-ONLY", Qty: 100000, Nominal: 100000, BuyerType: "user", BuyerRole: "user", HargaDasar: 101200, HargaFinal: 101200, Status: "paid"})
			if err != nil {
				t.Fatal(err)
			}
			order, err := orders.GetByInvoiceID(ctx, invoice)
			if err != nil {
				t.Fatal(err)
			}
			exec(`INSERT INTO app_order_payment(app_order_id,order_id,gross_amount,transaction_status,raw_request) VALUES($1,$2,101200,'settlement','{"wallet_debit":101200,"credit_debit":0}')`, order.ID, invoice)
			var received provider.Pulsa24JamPayRequest
			calls := 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				calls++
				if err := json.NewDecoder(r.Body).Decode(&received); err != nil {
					t.Error(err)
				}
				if len(received.RefID) > 20 {
					t.Error("upstream reference length exceeded")
				}
				w.Header().Set("Content-Type", "application/json")
				_ = json.NewEncoder(w).Encode(map[string]any{"ok": true, "status": "pending", "refid": received.RefID})
			}))
			defer server.Close()
			client := provider.NewPulsa24JamAdapter(provider.Pulsa24JamConfig{BaseURL: server.URL, APIKey: "test", PIN: "test"})
			svc := NewAppOrderFulfillmentService(orders, attempts, callbacks, repository.NewProdukAppPricingRepository(db), nil, nil, client)
			if err := svc.DispatchPaidOrder(ctx, order); err != nil {
				t.Fatal(err)
			}
			if err := svc.DispatchPaidOrder(ctx, order); err != nil {
				t.Fatal(err)
			}
			if calls != 1 || received.Qty != 100000 || received.Product != "GOPAY" || received.RefID == invoice {
				t.Fatalf("unexpected request calls=%d payload=%+v", calls, received)
			}
			attempt, err := attempts.GetByRefID(ctx, received.RefID, "Pulsa24Jam")
			if err != nil || attempt.AppOrderID != order.ID {
				t.Fatal("provider reference did not resolve original order", err)
			}
			callbackSvc := &ProviderCallbackService{repo: callbacks, appProviderRepo: attempts, appOrderRepo: orders}
			payload := map[string]any{"refid": received.RefID, "status": final, "message": final, "price": 101200}
			if final == "failed" {
				payload["status"] = 3
				payload["message"] = "Provider menolak permintaan"
			}
			for n := 0; n < 2; n++ {
				status, body := callbackSvc.ProcessPulsa24JamCallback(ctx, "", url.Values{}, payload)
				if status != 200 || body["ok"] != true {
					t.Fatalf("callback failed: %d %#v", status, body)
				}
			}
			fresh, err := orders.GetByID(ctx, order.ID)
			if err != nil {
				t.Fatal(err)
			}
			wantStatus, wantBalance := "success", int64(198800)
			if final == "failed" {
				wantStatus = "refunded"
				wantBalance = 300000
			}
			if fresh.Status != wantStatus || fresh.InvoiceID != invoice {
				t.Fatalf("wrong final order: %+v", fresh)
			}
			if balance := id("SELECT saldo FROM dompet_member WHERE member_id=$1", member); balance != wantBalance {
				t.Fatalf("balance=%d want %d", balance, wantBalance)
			}
			if final == "failed" {
				if n := id("SELECT count(*) FROM mutasi_dompet WHERE member_id=$1 AND ref_id=$2 AND arah='CREDIT'", member, invoice); n != 1 {
					t.Fatalf("expected one invoice-linked refund, got %d", n)
				}
			} else {
				if n := id("SELECT count(*) FROM mutasi_dompet_provider WHERE ref_id=$1 AND arah='debit'", received.RefID); n != 1 {
					logs, _ := os.ReadFile(filepath.Join(logDir, "provider_wallet.log"))
					t.Log(string(logs))
					t.Fatalf("expected one provider cost entry, got %d", n)
				}
			}
			if err := svc.DispatchPaidOrder(ctx, fresh); err != nil {
				t.Fatal(err)
			}
			if calls != 1 {
				t.Fatal("final order was resent")
			}
		})
	}
}
