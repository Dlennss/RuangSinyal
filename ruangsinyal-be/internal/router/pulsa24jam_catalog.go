package router

import (
	"context"
	"database/sql"
	"log"
	"os"
	"strings"
	"time"

	"ruangsinyal/internal/provider"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

func startPulsa24JamCatalogSync(db *sql.DB, client *provider.Pulsa24JamAdapter) {
	if db == nil || client == nil || !client.Configured() {
		return
	}
	if catalogSyncDisabled(context.Background(), db) {
		log.Printf("Pulsa24Jam product sync nonaktif: katalog produk sedang dikosongkan")
		return
	}
	interval := 15 * time.Minute
	raw := strings.TrimSpace(os.Getenv("PULSA24JAM_PRODUCT_SYNC_INTERVAL"))
	if raw == "" {
		raw = strings.TrimSpace(os.Getenv("Pulsa24Jam_PRODUCT_SYNC_INTERVAL"))
	}
	if raw != "" {
		if parsed, err := time.ParseDuration(raw); err == nil && parsed >= time.Minute {
			interval = parsed
		} else {
			log.Printf("Pulsa24Jam product sync interval tidak valid: %q; memakai %s", raw, interval)
		}
	}
	syncService := service.NewPulsa24JamCatalogSyncService(repository.NewPulsa24JamCatalogRepository(db), client)
	run := func() {
		if catalogSyncDisabled(context.Background(), db) {
			log.Printf("Pulsa24Jam product sync dilewati: flag product_catalog_cleared aktif")
			return
		}
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
		defer cancel()
		result, err := syncService.Sync(ctx)
		if err != nil {
			log.Printf("Pulsa24Jam product sync gagal: %v", err)
			return
		}
		log.Printf("Pulsa24Jam product sync selesai: %d produk", result.Synced)
	}
	go func() {
		// Jangan menahan startup HTTP; validasi live tetap dilakukan sebelum order dibuat.
		run()
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for range ticker.C {
			run()
		}
	}()
}

func catalogSyncDisabled(ctx context.Context, db *sql.DB) bool {
	if strings.EqualFold(strings.TrimSpace(os.Getenv("PULSA24JAM_PRODUCT_SYNC_ENABLED")), "false") {
		return true
	}

	checkCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	var tableExists bool
	err := db.QueryRowContext(checkCtx, `
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'app_runtime_flag'
)
`).Scan(&tableExists)
	if err != nil {
		log.Printf("Pulsa24Jam product sync flag tidak bisa dibaca: %v", err)
		return false
	}
	if !tableExists {
		return false
	}

	var disabled bool
	err = db.QueryRowContext(checkCtx, `
SELECT EXISTS (
  SELECT 1
  FROM public.app_runtime_flag
  WHERE key = 'product_catalog_cleared'
    AND value = 'true'
)
`).Scan(&disabled)
	if err != nil {
		log.Printf("Pulsa24Jam product sync flag tidak bisa dibaca: %v", err)
		return false
	}
	return disabled
}
