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
	"ruangsinyal/internal/service"
)

func main() {
	invoice := flag.String("invoice", "", "exact invoice to reconcile from stored P24 success response")
	apply := flag.Bool("apply", false, "apply verified stored success; default is read-only")
	flag.Parse()
	if strings.TrimSpace(*invoice) == "" || os.Getenv("DATABASE_URL") == "" {
		log.Fatal("invoice and DATABASE_URL are required")
	}
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	svc := service.NewAppOrderFulfillmentService(repository.NewAppOrderRepository(db), repository.NewAppOrderProviderTrxRepository(db), repository.NewProviderCallbackRepository(db), repository.NewProdukAppPricingRepository(db), nil, nil)
	if err := svc.ReconcileStoredPulsa24JamSuccess(ctx, *invoice, *apply); err != nil {
		log.Fatal(err)
	}
	fmt.Printf("invoice=%s stored_success_verified=true applied=%t\n", *invoice, *apply)
}
