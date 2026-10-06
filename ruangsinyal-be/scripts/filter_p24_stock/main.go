// filter_p24_stock hides explicitly empty SKUs from a saved pricelistfront response.
// It never changes prices, restores quarantined products, or deletes history.
package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"time"

	"github.com/lib/pq"
)

const stockMarker = "Pulsa24Jam_OUT_OF_STOCK"

type stockProduct struct {
	SKU       string `json:"kodeproduk"`
	Name      string `json:"namaproduk"`
	Empty     string `json:"kosong"`
	Disrupted string `json:"gangguan"`
}

type stockGroup struct {
	Name string         `json:"namaoperator"`
	Data []stockProduct `json:"data"`
}

func parseSnapshot(raw []byte) (empty, available []string, err error) {
	var input struct {
		Success bool         `json:"success"`
		Pulsa   []stockGroup `json:"pulsa"`
		PPOB    []stockGroup `json:"ppob"`
		Game    []stockGroup `json:"game"`
	}
	if err = json.Unmarshal(raw, &input); err != nil {
		return nil, nil, err
	}
	if !input.Success || input.Pulsa == nil || input.PPOB == nil {
		return nil, nil, fmt.Errorf("response unsuccessful or missing pulsa/ppob arrays")
	}
	seen := map[string]bool{}
	groups := append(append(input.Pulsa, input.PPOB...), input.Game...)
	for _, group := range groups {
		for _, product := range group.Data {
			sku := strings.TrimSpace(product.SKU)
			key := strings.ToUpper(sku)
			if sku == "" || strings.TrimSpace(product.Name) == "" || seen[key] {
				return nil, nil, fmt.Errorf("empty/duplicate product identity: %q", sku)
			}
			seen[key] = true
			if value := strings.ToLower(strings.TrimSpace(product.Disrupted)); value != "ya" && value != "tidak" {
				return nil, nil, fmt.Errorf("unknown gangguan flag for %q", sku)
			}
			switch strings.ToLower(strings.TrimSpace(product.Empty)) {
			case "ya":
				empty = append(empty, sku)
			case "tidak":
				available = append(available, sku)
			default:
				return nil, nil, fmt.Errorf("unknown kosong flag for %q", sku)
			}
		}
	}
	if len(seen) == 0 || len(available) == 0 {
		return nil, nil, fmt.Errorf("empty catalog or no available products; manual review required")
	}
	return empty, available, nil
}

type report struct {
	SourceSHA256       string   `json:"source_sha256"`
	Applied            bool     `json:"applied"`
	EmptyCount         int      `json:"source_empty"`
	AvailableCount     int      `json:"source_available"`
	MatchedEmpty       int      `json:"matched_empty"`
	MatchedAvailable   int      `json:"matched_available"`
	ToHide             int      `json:"active_to_hide"`
	PricingUpdated     int64    `json:"pricing_updated"`
	RoutesUpdated      int64    `json:"routes_updated"`
	HiddenSKUs         []string `json:"matched_empty_skus"`
	UnmatchedEmpty     []string `json:"unmatched_empty_skus"`
	UnmatchedAvailable []string `json:"unmatched_available_skus"`
}

func filterStock(ctx context.Context, db *sql.DB, empty, available []string, apply bool, expectedHide int) (*report, error) {
	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: !apply})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	if apply {
		if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock(7242401)`); err != nil {
			return nil, err
		}
		// Prevent administrative edits from changing the approved set mid-update.
		if _, err := tx.ExecContext(ctx, `LOCK TABLE public.produk, public.produk_app_pricing, public.produk_provider_map IN SHARE ROW EXCLUSIVE MODE`); err != nil {
			return nil, err
		}
	}
	r := &report{EmptyCount: len(empty), AvailableCount: len(available), HiddenSKUs: []string{}, UnmatchedEmpty: []string{}, UnmatchedAvailable: []string{}}
	for _, batch := range []struct {
		skus  []string
		empty bool
	}{{empty, true}, {available, false}} {
		rows, err := tx.QueryContext(ctx, `
SELECT source.sku, ap.produk_id IS NOT NULL, COALESCE(ap.aktif, false)
FROM unnest($1::text[]) AS source(sku)
LEFT JOIN public.produk p ON p.sku = source.sku
LEFT JOIN public.produk_app_pricing ap ON ap.produk_id = p.id AND LOWER(TRIM(ap.provider)) = 'pulsa24jam'
ORDER BY source.sku`, pq.Array(batch.skus))
		if err != nil {
			return nil, err
		}
		for rows.Next() {
			var sku string
			var matched, active bool
			if err := rows.Scan(&sku, &matched, &active); err != nil {
				rows.Close()
				return nil, err
			}
			if batch.empty {
				if matched {
					r.MatchedEmpty++
					r.HiddenSKUs = append(r.HiddenSKUs, sku)
					if active {
						r.ToHide++
					}
				} else {
					r.UnmatchedEmpty = append(r.UnmatchedEmpty, sku)
				}
			} else if matched {
				r.MatchedAvailable++
			} else {
				r.UnmatchedAvailable = append(r.UnmatchedAvailable, sku)
			}
		}
		if err := rows.Err(); err != nil {
			rows.Close()
			return nil, err
		}
		rows.Close()
	}
	if !apply {
		return r, nil
	}
	if expectedHide < 0 || r.ToHide != expectedHide {
		return nil, fmt.Errorf("active hide count changed: got %d, expected %d", r.ToHide, expectedHide)
	}
	result, err := tx.ExecContext(ctx, `
UPDATE public.produk_app_pricing ap
SET aktif = false,
    yuscom_status = CASE WHEN LOWER(TRIM(ap.yuscom_status)) = 'pulsa24jam_unavailable' THEN ap.yuscom_status ELSE $2 END,
    updated_at = now(), diubah_pada = now()
FROM public.produk p
WHERE p.id = ap.produk_id AND p.sku = ANY($1::text[])
  AND LOWER(TRIM(ap.provider)) = 'pulsa24jam'
  AND (ap.aktif OR LOWER(TRIM(COALESCE(ap.yuscom_status, ''))) NOT IN ('pulsa24jam_unavailable', 'pulsa24jam_out_of_stock'))`, pq.Array(empty), stockMarker)
	if err != nil {
		return nil, err
	}
	r.PricingUpdated, err = result.RowsAffected()
	if err != nil {
		return nil, err
	}
	result, err = tx.ExecContext(ctx, `
UPDATE public.produk_provider_map m SET aktif = false, diubah_pada = now()
FROM public.produk p JOIN public.produk_app_pricing ap ON ap.produk_id = p.id
WHERE m.produk_id = p.id AND p.sku = ANY($1::text[]) AND m.aktif
  AND LOWER(TRIM(m.provider)) = 'pulsa24jam' AND LOWER(TRIM(ap.provider)) = 'pulsa24jam'`, pq.Array(empty))
	if err != nil {
		return nil, err
	}
	r.RoutesUpdated, err = result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	r.Applied = true
	return r, nil
}

func main() {
	log.SetFlags(0)
	file := flag.String("file", "", "saved pricelistfront JSON response")
	digest := flag.String("sha256", "", "required snapshot SHA256 when applying")
	apply := flag.Bool("apply", false, "hide empty matched SKUs; default is read-only")
	expected := flag.Int("expected-hide", -1, "active_to_hide from the reviewed dry-run")
	flag.Parse()
	f, err := os.Open(*file)
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	raw, err := io.ReadAll(io.LimitReader(f, 30*1024*1024+1))
	if err != nil || len(raw) > 30*1024*1024 {
		log.Fatal("snapshot unreadable or too large")
	}
	checksum := sha256.Sum256(raw)
	actualDigest := hex.EncodeToString(checksum[:])
	if *apply && (*digest != actualDigest || *expected < 0) {
		log.Fatal("apply requires matching -sha256 and reviewed -expected-hide")
	}
	empty, available, err := parseSnapshot(bytes.TrimPrefix(raw, []byte{0xef, 0xbb, 0xbf}))
	if err != nil {
		log.Fatal(err)
	}
	if os.Getenv("DATABASE_URL") == "" {
		log.Fatal("DATABASE_URL is required")
	}
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	r, err := filterStock(ctx, db, empty, available, *apply, *expected)
	if err != nil {
		log.Fatal(err)
	}
	r.SourceSHA256 = actualDigest
	if err := json.NewEncoder(os.Stdout).Encode(r); err != nil {
		log.Fatal(err)
	}
}
