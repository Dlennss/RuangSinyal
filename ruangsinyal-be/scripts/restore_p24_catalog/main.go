package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"ruangsinyal/internal/repository"
)

type snapshot struct {
	SourceSHA256 string                             `json:"source_sha256"`
	Products     []repository.Pulsa24JamCatalogItem `json:"products"`
}

func validateSnapshot(s snapshot, expected int) error {
	digest, err := hex.DecodeString(s.SourceSHA256)
	if err != nil || len(digest) != sha256.Size {
		return fmt.Errorf("source SHA256 tidak valid")
	}
	if expected <= 0 || len(s.Products) != expected {
		return fmt.Errorf("jumlah produk %d tidak sesuai jumlah yang disetujui %d", len(s.Products), expected)
	}
	seen := map[string]bool{}
	for _, p := range s.Products {
		key := strings.ToUpper(strings.TrimSpace(p.SKU))
		if key == "" || seen[key] || strings.TrimSpace(p.Name) == "" || strings.TrimSpace(p.CategoryName) == "" || strings.TrimSpace(p.BrandName) == "" {
			return fmt.Errorf("identitas produk kosong/duplikat: %q", p.SKU)
		}
		if (p.PriceType != "FIXED" && p.PriceType != "OPEN_AMOUNT") || p.Price < 0 || (p.MaximumNominal != nil && *p.MaximumNominal <= 0) {
			return fmt.Errorf("harga/tipe/batas nominal produk tidak valid: %q", p.SKU)
		}
		seen[key] = true
	}
	return nil
}

func main() {
	log.SetFlags(0)
	file := flag.String("file", "", "validated P24 snapshot JSON")
	expected := flag.Int("expected-count", 0, "approved product count")
	apply := flag.Bool("apply", false, "restore into an empty catalog; default validates only")
	flag.Parse()
	f, err := os.Open(*file)
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	var s snapshot
	decoder := json.NewDecoder(f)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&s); err != nil {
		log.Fatal(err)
	}
	if err := validateSnapshot(s, *expected); err != nil {
		log.Fatal(err)
	}
	categories, brands := map[string]bool{}, map[string]bool{}
	fixed := 0
	for _, p := range s.Products {
		categories[p.CategoryName] = true
		brands[strings.ToLower(strings.TrimSpace(p.BrandName))] = true
		if p.PriceType == "FIXED" {
			fixed++
		}
	}
	fmt.Printf("Validated: products=%d categories=%d brands=%d fixed=%d source_sha256=%s\n", len(s.Products), len(categories), len(brands), fixed, s.SourceSHA256)
	if !*apply {
		return
	}
	if os.Getenv("DATABASE_URL") == "" {
		log.Fatal("DATABASE_URL is required")
	}
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()
	var rows int64
	if err := db.QueryRowContext(ctx, `SELECT (SELECT count(*) FROM public.produk) + (SELECT count(*) FROM public.kategori) + (SELECT count(*) FROM public.brand) + (SELECT count(*) FROM public.produk_app_pricing)`).Scan(&rows); err != nil {
		log.Fatal(err)
	}
	if rows != 0 {
		log.Fatal("restore dibatalkan: katalog tidak kosong; jangan timpa data yang sudah ada")
	}
	result, err := repository.NewPulsa24JamCatalogRepository(db).Sync(ctx, s.Products)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Restored atomically: %d products\n", result.Synced)
	_, err = db.ExecContext(ctx, `INSERT INTO public.app_runtime_flag (key,value,updated_at)
VALUES ('product_catalog_cleared','false',now()), ('p24_catalog_source','user_attachment',now()),
('p24_catalog_live_verified','false',now()), ('p24_catalog_source_sha256',$1,now())
ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`, s.SourceSHA256)
	if err != nil {
		log.Fatalf("katalog sudah dipulihkan, tetapi pembaruan flag gagal: %v", err)
	}
	fmt.Println("Catalog flags updated; no provider request or payment executed")
}
