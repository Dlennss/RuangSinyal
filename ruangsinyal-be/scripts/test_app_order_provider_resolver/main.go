package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/lib/pq"

	"ruangsinyal/internal/repository"
)

type orderRow struct {
	InvoiceID string
	SKU       string
	Nominal   int64
}

func main() {
	providerName := flag.String("provider", "yuscom", "provider to resolve without dispatching a transaction")
	flag.Parse()
	dsn := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dsn == "" {
		log.Fatal("DATABASE_URL kosong")
	}
	if flag.NArg() < 1 {
		log.Fatal("pakai: go run ./scripts/test_app_order_provider_resolver [-provider pulsa24jam] <invoice_id> [...]")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	repo := repository.NewProviderCallbackRepository(db)

	failed := false
	for _, invoiceID := range flag.Args() {
		var row orderRow
		err := db.QueryRowContext(ctx, `
SELECT invoice_id, COALESCE(produk_sku_snapshot, ''), COALESCE(nominal, 0)
FROM public.app_order
WHERE invoice_id = $1
LIMIT 1
`, strings.TrimSpace(invoiceID)).Scan(&row.InvoiceID, &row.SKU, &row.Nominal)
		if err != nil {
			log.Printf("invoice=%s err=%v", invoiceID, err)
			failed = true
			continue
		}

		code, err := repo.ResolveProviderProductCodeByNominal(ctx, *providerName, row.SKU, row.Nominal)
		if err != nil {
			log.Printf("invoice=%s sku=%s nominal=%d err=%v", row.InvoiceID, row.SKU, row.Nominal, err)
			failed = true
			continue
		}
		fmt.Printf("invoice=%s sku=%s nominal=%d resolved=%s\n", row.InvoiceID, row.SKU, row.Nominal, code)
		if code == "" {
			failed = true
		}
	}
	if failed {
		os.Exit(1)
	}
}
