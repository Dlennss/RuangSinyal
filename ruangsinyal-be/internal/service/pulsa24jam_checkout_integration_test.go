package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
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
	exec("INSERT INTO dompet_provider(provider,saldo) VALUES('pulsa24jam',1000000)")
	orders := repository.NewAppOrderRepository(db)
	attempts := repository.NewAppOrderProviderTrxRepository(db)
	callbacks := repository.NewProviderCallbackRepository(db)
	ctx := context.Background()
	t.Run("DANA creation and catalog timeout do not debit balance", func(t *testing.T) {
		dana := id("INSERT INTO produk(sku,nama,kategori_id,brand_id,tipe_harga,aktif) VALUES('DANA','Test DANA',$1,$2,'OPEN_AMOUNT',true) RETURNING id", category, brand)
		exec("INSERT INTO produk_app_pricing(produk_id,provider,harga,harga_dasar,aktif) VALUES($1,'Pulsa24Jam',1000,1000,true)", dana)
		exec("INSERT INTO kategori_fee_app(kategori_id,aktif) VALUES($1,true)", category)
		member := id("INSERT INTO member(email,nama,role,aktif) VALUES('create@example.invalid','Synthetic create','user',true) RETURNING id")
		exec("INSERT INTO dompet_member(member_id,saldo) VALUES($1,300000)", member)
		svc := NewAppOrderService(orders, repository.NewAppOrderPaymentRepository(db), repository.NewProdukRepository(db), repository.NewProdukAppPricingRepository(db), repository.NewKategoriFeeAppRepository(db), attempts, nil)
		client := provider.NewPulsa24JamAdapter(provider.Pulsa24JamConfig{BaseURL: "https://provider.invalid", APIKey: "test", PIN: "test"})
		svc.SetPulsa24JamClient(client)
		input := repository.AppOrderCreateInput{MemberID: &member, BuyerType: "user", BuyerRole: "user", ProdukID: dana, Dest: "TEST-ONLY", Qty: 100000}
		before := id("SELECT count(*) FROM app_order")
		client.Client.Transport = catalogTestTransport(func(r *http.Request) (*http.Response, error) {
			return nil, context.DeadlineExceeded
		})
		if _, err := svc.Create(ctx, input); !errors.Is(err, ErrAppOrderCatalogUnavailable) {
			t.Fatalf("expected catalog timeout, got %v", err)
		}
		if id("SELECT count(*) FROM app_order") != before {
			t.Fatal("timeout created an order")
		}
		client.Client.Transport = catalogTestTransport(func(r *http.Request) (*http.Response, error) {
			var req provider.Pulsa24JamPayRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				t.Fatal(err)
			}
			if req.Commands != "PRODUK" || req.Product != "DANA" {
				t.Fatalf("unexpected provider request: %+v", req)
			}
			body := `{"ok":true,"items":[{"sku":"DANA","tipe_harga":"OPEN_AMOUNT","fee_tambahan":1000,"aktif":true}]}`
			return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
		})
		order, err := svc.Create(ctx, input)
		if err != nil {
			t.Fatal(err)
		}
		if order.Status != "pending_payment" || order.HargaFinal != 101000 || order.Nominal != 100000 {
			t.Fatalf("unexpected DANA order: %+v", order)
		}
		if id("SELECT saldo FROM dompet_member WHERE member_id=$1", member) != 300000 || id("SELECT count(*) FROM app_order_provider_trx") != 0 || id("SELECT count(*) FROM app_order_payment") != 0 {
			t.Fatal("creating an unpaid order must not charge or dispatch")
		}
		wrongQuote := int64(100999)
		input.ExpectedTotal = &wrongQuote
		before = id("SELECT count(*) FROM app_order")
		if _, err := svc.Create(ctx, input); !errors.Is(err, ErrAppOrderPriceChanged) {
			t.Fatalf("stale checkout price was not rejected: %v", err)
		}
		if id("SELECT count(*) FROM app_order") != before {
			t.Fatal("price mismatch created an order")
		}
		correctQuote := int64(101000)
		input.ExpectedTotal = &correctQuote
		exec("UPDATE dompet_member SET saldo=0 WHERE member_id=$1", member)
		order, err = svc.Create(ctx, input)
		if err != nil || order.HargaFinal != correctQuote || order.Fee != 0 {
			t.Fatalf("insufficient wallet must not introduce a QRIS fee: %+v %v", order, err)
		}
		if id("SELECT saldo FROM dompet_member WHERE member_id=$1", member) != 0 || id("SELECT count(*) FROM app_order_provider_trx") != 0 || id("SELECT count(*) FROM app_order_payment") != 0 {
			t.Fatal("quote check must not charge or dispatch")
		}
		exec("UPDATE dompet_member SET saldo=300000 WHERE member_id=$1", member)
	})
	for index, mode := range []string{"success", "failed", "immediate_success", "stored_success", "immediate_failed", "upstream_503", "malformed", "wrong_reference", "pending_failure_word"} {
		t.Run(mode, func(t *testing.T) {
			final := "success"
			if mode == "failed" || mode == "immediate_failed" {
				final = "failed"
			}
			member := id("INSERT INTO member(email,nama,role,aktif) VALUES($1,'Synthetic test','user',true) RETURNING id", mode+"@example.invalid")
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
				switch mode {
				case "immediate_failed":
					_, _ = fmt.Fprintf(w, `{"ok":true,"refid":%q,"status": 3,"message":"Transaksi gagal"}`, received.RefID)
					return
				case "upstream_503":
					w.WriteHeader(http.StatusServiceUnavailable)
					_, _ = w.Write([]byte(`{"message":"SYSTEM ERROR"}`))
					return
				case "malformed":
					_, _ = w.Write([]byte(`<html>FAILED</html>`))
					return
				case "wrong_reference":
					_, _ = w.Write([]byte(`{"status":3,"refid":"OTHER-ORDER","message":"Gagal"}`))
					return
				case "pending_failure_word":
					_, _ = fmt.Fprintf(w, `{"refid":%q,"status":1,"message":"Gagal cek status, masih diproses"}`, received.RefID)
					return
				}
				if mode == "immediate_success" {
					_ = json.NewEncoder(w).Encode(map[string]any{"ok": true, "transaksi_member": map[string]any{"ref_id": received.RefID, "status": 2, "price": 101200, "keterangan": "REFF:TEST-SUCCESS"}})
					return
				}
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
			if mode == "immediate_success" {
				fresh, err := orders.GetByID(ctx, order.ID)
				if err != nil || fresh.Status != "success" || attempt.Status != "success" {
					t.Fatal("immediate final response was left pending", err)
				}
			}
			if mode == "upstream_503" || mode == "malformed" || mode == "wrong_reference" || mode == "pending_failure_word" {
				fresh, err := orders.GetByID(ctx, order.ID)
				if err != nil || fresh.Status != "processing_provider" || attempt.Status != "pending" {
					t.Fatal("uncertain response must await verified confirmation", err)
				}
				if id("SELECT saldo FROM dompet_member WHERE member_id=$1", member) != 198800 {
					t.Fatal("uncertain reply refunded the purchase")
				}
			}
			if mode == "stored_success" {
				storeResponse := func(ref string) {
					body, _ := json.Marshal(map[string]any{"ok": true, "transaksi_member": map[string]any{"ref_id": ref, "status": 2, "price": 101200}})
					envelope, _ := json.Marshal(map[string]any{"http_status": 200, "body": string(body)})
					if err := attempts.UpdateResult(ctx, repository.AppOrderProviderTrxUpdateInput{ID: attempt.ID, Status: "pending", RawCallback: string(envelope)}); err != nil {
						t.Fatal(err)
					}
				}
				storeResponse("WRONG-REF")
				if err := svc.ReconcileStoredPulsa24JamSuccess(ctx, invoice, true); err == nil {
					t.Fatal("accepted wrong reference")
				}
				storeResponse(received.RefID)
				if err := svc.ReconcileStoredPulsa24JamSuccess(ctx, invoice, false); err != nil {
					t.Fatal(err)
				}
				fresh, err := orders.GetByID(ctx, order.ID)
				if err != nil || fresh.Status != "processing_provider" {
					t.Fatal("dry run modified order", err)
				}
				for n := 0; n < 2; n++ {
					if err := svc.ReconcileStoredPulsa24JamSuccess(ctx, invoice, true); err != nil {
						t.Fatal(err)
					}
				}
				if calls != 1 {
					t.Fatal("stored response reconciliation resent PAY")
				}
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
			// A delayed acknowledgement must not overwrite the final result.
			status, response := callbackSvc.ProcessPulsa24JamCallback(ctx, "", nil, map[string]any{"refid": received.RefID, "status": 1})
			if status != 200 || response["already_final"] != true {
				t.Fatalf("late callback not ignored: %v", response)
			}
			if err := attempts.UpdateResult(ctx, repository.AppOrderProviderTrxUpdateInput{ID: attempt.ID, Status: "pending", Pesan: "late acknowledgement"}); err != nil {
				t.Fatal(err)
			}
			latestAttempt, err := attempts.GetByRefID(ctx, received.RefID, "Pulsa24Jam")
			if err != nil || latestAttempt.Status != final {
				t.Fatal("late acknowledgement downgraded provider status", err)
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
			if final == "failed" {
				createSvc := NewAppOrderService(orders, nil, nil, nil, nil, nil, nil)
				before := id("SELECT count(*) FROM app_order")
				_, err := createSvc.Create(ctx, repository.AppOrderCreateInput{BuyerType: "user", MemberID: &member, ProdukID: product, Qty: 100000, Dest: "TEST-ONLY"})
				if !errors.Is(err, ErrAppOrderRecentRejection) || id("SELECT count(*) FROM app_order") != before {
					t.Fatalf("recent rejection must block before creating order or calling provider: %v", err)
				}
				for _, check := range []struct {
					member, product, qty int64
					dest                 string
				}{
					{member, product, 100000, "OTHER-DEST"}, {member + 1000, product, 100000, "TEST-ONLY"},
					{member, product + 1000, 100000, "TEST-ONLY"}, {member, product, 50000, "TEST-ONLY"},
				} {
					blocked, err := orders.HasRecentP24Rejection(ctx, check.member, check.product, check.qty, check.dest)
					if err != nil || blocked {
						t.Fatalf("retry guard affected unrelated purchase: %v", err)
					}
				}
				exec("UPDATE app_order_provider_trx SET diubah_pada=now()-interval '6 minutes' WHERE id=$1", attempt.ID)
				blocked, err := orders.HasRecentP24Rejection(ctx, member, product, 100000, "TEST-ONLY")
				if err != nil || blocked {
					t.Fatalf("retry guard did not expire: %v", err)
				}
			}
		})
	}
	t.Run("rejected SKU stays blocked after catalog sync", func(t *testing.T) {
		catalog := repository.NewPulsa24JamCatalogRepository(db)
		items := []repository.Pulsa24JamCatalogItem{{SKU: "TM3", Name: "PAKET MINGGUAN 3.5 GB", CategoryName: "Paket Data", BrandName: "Telkomsel", PriceType: "FIXED", Price: 1000}}
		if _, err := catalog.Sync(ctx, items); err != nil {
			t.Fatal(err)
		}
		productID := id("SELECT id FROM produk WHERE sku='TM3'")
		pricing := repository.NewProdukAppPricingRepository(db)
		if err := pricing.MarkProviderProductUnavailable(ctx, productID, "Pulsa24Jam"); err != nil {
			t.Fatal(err)
		}
		for _, marker := range []string{repository.Pulsa24JamUnavailableStatus, "Pulsa24Jam_OUT_OF_STOCK"} {
			exec("UPDATE produk_app_pricing SET yuscom_status=$1 WHERE produk_id=$2", marker, productID)
			if _, err := catalog.Sync(ctx, items); err != nil {
				t.Fatal(err)
			}
			if _, err := pricing.GetEffectiveByProdukIDActive(ctx, productID); !errors.Is(err, sql.ErrNoRows) {
				t.Fatalf("blocked pricing reactivated: %v", err)
			}
			if id("SELECT count(*) FROM produk_provider_map WHERE produk_id=$1 AND aktif=true", productID) != 0 {
				t.Fatal("blocked routing reactivated")
			}
		}
	})
}
