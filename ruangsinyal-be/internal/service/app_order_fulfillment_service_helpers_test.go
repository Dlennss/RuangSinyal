package service

import (
	"testing"

	"ruangsinyal/internal/repository"
)

func TestAppOrderProviderImmediateRejectPulsa24Jam(t *testing.T) {
	tests := []struct {
		name string
		body string
		want bool
	}{
		{name: "spaced numeric rejection", body: `{"status": 3, "message":"Ditolak"}`, want: true},
		{name: "nested rejection", body: `{"transaksi_member":{"status":3,"keterangan":"Ditolak"}}`, want: true},
		{name: "pending with failure word is not final", body: `{"status":1,"message":"Gagal cek status, masih diproses"}`, want: false},
		{name: "HTML error does not prove rejection", body: `<html>FAILED</html>`, want: false},
		{name: "success with failure word is not rejection", body: `{"status":2,"message":"Tidak gagal"}`, want: false},
		{
			name: "insufficient provider balance",
			body: `{"message":"saldo tidak cukup","ok":true,"refid":"INV-1","status":3}`,
			want: true,
		},
		{
			name: "numeric rejected status",
			body: `{"message":"produk tidak ditemukan","ok":true,"refid":"INV-2","status":3}`,
			want: true,
		},
		{
			name: "pending accepted",
			body: `{"message":"Transaksi sedang diproses","ok":true,"refid":"INV-3","status":"pending"}`,
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := appOrderProviderImmediateReject("Pulsa24Jam", tt.body); got != tt.want {
				t.Fatalf("appOrderProviderImmediateReject() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAppOrderProviderProductUnavailable(t *testing.T) {
	if !appOrderProviderProductUnavailable("Pulsa24Jam", `{"message":"nominal produk tidak valid","status":3}`) {
		t.Fatal("invalid upstream product nominal must block further purchases")
	}
	if !appOrderProviderProductUnavailable("Pulsa24Jam", `{"message":"Produk kehabisan stok","status":3}`) {
		t.Fatal("out-of-stock response should quarantine the product")
	}
	if appOrderProviderProductUnavailable("Pulsa24Jam", `{"message":"Nomor tujuan salah","status":3}`) {
		t.Fatal("business rejection unrelated to stock must not quarantine the product")
	}
	if appOrderProviderProductUnavailable("yuscom", `{"message":"Produk kehabisan stok","status":3}`) {
		t.Fatal("only Pulsa24Jam products should be quarantined")
	}
}

func TestResolvePulsa24JamAppRequest(t *testing.T) {
	tests := []struct {
		name        string
		order       repository.AppOrderRow
		wantProduct string
		wantQty     int64
	}{
		{
			name:        "fixed dana keeps H2HR SKU",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "UDDND10", ProdukNamaSnapshot: "Dana 10.000", Qty: 1, HargaDasar: 11055},
			wantProduct: "UDDND10", wantQty: 1,
		},
		{
			name:        "fixed gopay keeps H2HR SKU",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "UDGP10", ProdukNamaSnapshot: "Gopay 10.000", Qty: 1, HargaDasar: 11650},
			wantProduct: "UDGP10", wantQty: 1,
		},
		{
			name:        "gopay driver keeps dedicated route",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "UDGD15", ProdukNamaSnapshot: "Gopay Driver 15.000", Qty: 1, HargaDasar: 16450},
			wantProduct: "UDGD15", wantQty: 1,
		},
		{
			name:        "open amount remains unchanged",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "DANA", ProdukNamaSnapshot: "Dana Bebas Nominal", Qty: 25000, HargaDasar: 26000},
			wantProduct: "DANA", wantQty: 25000,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			product, qty := resolvePulsa24JamAppRequest(tt.order.ProdukSKUSnapshot, &tt.order)
			if product != tt.wantProduct || qty != tt.wantQty {
				t.Fatalf("got product=%s qty=%d, want product=%s qty=%d", product, qty, tt.wantProduct, tt.wantQty)
			}
		})
	}
}
