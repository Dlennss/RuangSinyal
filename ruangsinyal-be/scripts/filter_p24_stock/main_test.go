package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"os"
	"reflect"
	"strings"
	"testing"
)

func fixture(products []stockProduct) []byte {
	raw, _ := json.Marshal(map[string]any{"success": true, "pulsa": []stockGroup{{Name: "Test", Data: products}}, "ppob": []stockGroup{}, "game": []stockGroup{}})
	return raw
}

func TestSnapshotUsesExplicitStockFlagOnly(t *testing.T) {
	raw := []byte(`{"success":true,"pulsa":[{"namaoperator":"Test","data":[{"kodeproduk":"EMPTY","namaproduk":"Stock empty","harga":50000,"kosong":"Ya","gangguan":"Tidak"},{"kodeproduk":"KEEP","namaproduk":"Open amount zero fee","harga":0,"kosong":"Tidak","gangguan":"Tidak"}]}],"ppob":[],"game":[]}`)
	empty, available, err := parseSnapshot(raw)
	if err != nil || !reflect.DeepEqual(empty, []string{"EMPTY"}) || !reflect.DeepEqual(available, []string{"KEEP"}) {
		t.Fatalf("unexpected stock classification: %v %v %v", empty, available, err)
	}
}

func TestSnapshotRejectsUnsafeInputs(t *testing.T) {
	valid := stockProduct{SKU: "KEEP", Name: "Keep", Empty: "Tidak", Disrupted: "Tidak"}
	for name, raw := range map[string][]byte{
		"unauthorized":       []byte(`{"success":false,"msg":"NOT AUTHORIZE"}`),
		"missing sections":   []byte(`{"success":true,"pulsa":[]}`),
		"empty response":     []byte(`{"success":true,"pulsa":[],"ppob":[]}`),
		"all empty":          fixture([]stockProduct{{SKU: "EMPTY", Name: "Empty", Empty: "Ya", Disrupted: "Tidak"}}),
		"missing sku":        fixture([]stockProduct{valid, {Name: "Empty", Empty: "Ya", Disrupted: "Tidak"}}),
		"duplicate":          fixture([]stockProduct{valid, {SKU: " keep ", Name: "Duplicate", Empty: "Ya", Disrupted: "Tidak"}}),
		"unknown flag":       fixture([]stockProduct{valid, {SKU: "UNKNOWN", Name: "Unknown", Empty: "", Disrupted: "Tidak"}}),
		"missing disruption": fixture([]stockProduct{valid, {SKU: "UNKNOWN", Name: "Unknown", Empty: "Ya"}}),
		"trailing json":      append(fixture([]stockProduct{valid}), []byte(`{}`)...),
	} {
		t.Run(name, func(t *testing.T) {
			if _, _, err := parseSnapshot(raw); err == nil {
				t.Fatal("unsafe response accepted")
			}
		})
	}
}

// Opt-in integration test: an empty disposable database only, never production.
func TestFilterStockIsolatedDatabase(t *testing.T) {
	dsn := os.Getenv("P24_STOCK_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("P24_STOCK_TEST_DATABASE_URL is not set")
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	var name string
	if err := db.QueryRow(`SELECT current_database()`).Scan(&name); err != nil || !strings.HasPrefix(name, "ruangsinyal_p24_stock_test_") {
		t.Fatal("refusing non-test database", err)
	}
	var count int
	if err := db.QueryRow(`SELECT count(*) FROM information_schema.tables WHERE table_schema='public'`).Scan(&count); err != nil || count != 0 {
		t.Fatal("test database must be empty", err)
	}
	_, err = db.Exec(`
CREATE TABLE produk(id bigint PRIMARY KEY,sku text UNIQUE,aktif boolean);
CREATE TABLE produk_app_pricing(produk_id bigint UNIQUE REFERENCES produk(id),provider text,harga bigint,yuscom_status text,aktif boolean,updated_at timestamptz,diubah_pada timestamptz);
CREATE TABLE produk_provider_map(produk_id bigint REFERENCES produk(id),provider text,kode_provider text,aktif boolean,diubah_pada timestamptz);
INSERT INTO produk VALUES (1,'EMPTY',true),(2,'KEEP',true),(3,'QUARANTINED',true),(4,'OTHER',true),(5,'ABSENT',true),(6,'lower',true);
INSERT INTO produk_app_pricing(produk_id,provider,harga,yuscom_status,aktif) VALUES
 (1,'Pulsa24Jam',20000,'ACTIVE',true),(2,'Pulsa24Jam',1000,'ACTIVE',true),(3,'Pulsa24Jam',7000,'Pulsa24Jam_UNAVAILABLE',false),
 (4,'OtherProvider',3000,'ACTIVE',true),(5,'Pulsa24Jam',4000,'ACTIVE',true),(6,'Pulsa24Jam',5000,'ACTIVE',true);
INSERT INTO produk_provider_map(produk_id,provider,kode_provider,aktif) VALUES
 (1,'Pulsa24Jam','EMPTY',true),(1,'OtherProvider','EMPTY',true),(2,'Pulsa24Jam','KEEP',true),(3,'Pulsa24Jam','QUARANTINED',false),
 (4,'OtherProvider','OTHER',true),(5,'Pulsa24Jam','ABSENT',true),(6,'Pulsa24Jam','lower',true);`)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	empty, available := []string{"EMPTY", "QUARANTINED", "OTHER", "LOWER", "MISSING"}, []string{"KEEP", "NEW"}
	snapshot := func() string {
		t.Helper()
		var value string
		if err := db.QueryRow(`SELECT json_build_array((SELECT json_agg(p ORDER BY id) FROM produk p),(SELECT json_agg(ap ORDER BY produk_id) FROM produk_app_pricing ap),(SELECT json_agg(m ORDER BY produk_id,provider) FROM produk_provider_map m))::text`).Scan(&value); err != nil {
			t.Fatal(err)
		}
		return value
	}
	before := snapshot()
	r, err := filterStock(ctx, db, empty, available, false, -1)
	if err != nil || r.ToHide != 1 || r.MatchedEmpty != 2 || r.MatchedAvailable != 1 {
		t.Fatalf("bad preview: %+v %v", r, err)
	}
	if snapshot() != before {
		t.Fatal("dry run changed data")
	}
	if _, err := filterStock(ctx, db, empty, available, true, 99); err == nil {
		t.Fatal("stale approval accepted")
	}
	if snapshot() != before {
		t.Fatal("failed apply changed data")
	}
	r, err = filterStock(ctx, db, empty, available, true, 1)
	if err != nil || !r.Applied || r.PricingUpdated != 1 || r.RoutesUpdated != 1 {
		t.Fatalf("bad apply: %+v %v", r, err)
	}
	var valid bool
	err = db.QueryRow(`SELECT
 (SELECT NOT aktif AND yuscom_status='Pulsa24Jam_OUT_OF_STOCK' AND harga=20000 FROM produk_app_pricing WHERE produk_id=1)
 AND (SELECT NOT aktif AND yuscom_status='Pulsa24Jam_UNAVAILABLE' AND harga=7000 FROM produk_app_pricing WHERE produk_id=3)
 AND (SELECT bool_and(aktif) FROM produk_app_pricing WHERE produk_id IN (2,4,5,6))
 AND (SELECT bool_and(aktif) FROM produk)
 AND (SELECT aktif FROM produk_provider_map WHERE produk_id=1 AND provider='OtherProvider')
 AND (SELECT NOT aktif FROM produk_provider_map WHERE produk_id=1 AND provider='Pulsa24Jam')`).Scan(&valid)
	if err != nil || !valid {
		t.Fatal("scope/price/quarantine preservation failed", err)
	}
	after := snapshot()
	r, err = filterStock(ctx, db, empty, available, true, 0)
	if err != nil || r.PricingUpdated != 0 || r.RoutesUpdated != 0 || snapshot() != after {
		t.Fatalf("not idempotent: %+v %v", r, err)
	}
	if _, err := filterStock(ctx, db, []string{}, []string{"EMPTY", "QUARANTINED"}, true, 0); err != nil {
		t.Fatal(err)
	}
	if snapshot() != after {
		t.Fatal("available list reactivated blocked products")
	}
}
