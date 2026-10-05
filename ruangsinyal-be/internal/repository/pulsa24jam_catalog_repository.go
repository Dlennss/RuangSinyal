package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

type Pulsa24JamCatalogItem struct {
	SKU            string
	Name           string
	GroupName      string
	CategoryName   string
	BrandName      string
	PriceType      string
	Price          int64
	MaximumNominal *int64
}

type Pulsa24JamCatalogSyncResult struct {
	Synced int
}

type Pulsa24JamCatalogRepository struct {
	db *sql.DB
}

func NewPulsa24JamCatalogRepository(db *sql.DB) *Pulsa24JamCatalogRepository {
	return &Pulsa24JamCatalogRepository{db: db}
}

func (r *Pulsa24JamCatalogRepository) Sync(ctx context.Context, items []Pulsa24JamCatalogItem) (*Pulsa24JamCatalogSyncResult, error) {
	if r == nil || r.db == nil {
		return nil, fmt.Errorf("repository katalog Pulsa24Jam belum siap")
	}
	validated, err := validatePulsa24JamCatalog(items)
	if err != nil {
		return nil, err
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	// Serialize catalog replacements so concurrent syncs cannot leave a mixed snapshot.
	if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock(7242401)`); err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `
INSERT INTO public.provider (nama, aktif, dibuat_pada, diubah_pada)
VALUES ('Pulsa24Jam', true, now(), now())
ON CONFLICT (nama) DO UPDATE SET aktif = true, diubah_pada = now()
`); err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE public.produk_app_pricing SET aktif = false, updated_at = now() WHERE aktif = true`); err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE public.produk_provider_map SET aktif = false, diubah_pada = now() WHERE aktif = true`); err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE public.produk SET aktif = false, diubah_pada = now() WHERE aktif = true`); err != nil {
		return nil, err
	}

	synced := 0
	for _, item := range validated {
		categoryID, err := ensureCatalogMaster(ctx, tx, "kategori", item.CategoryName)
		if err != nil {
			return nil, err
		}
		brandID, err := ensureCatalogMaster(ctx, tx, "brand", item.BrandName)
		if err != nil {
			return nil, err
		}
		if _, err := tx.ExecContext(ctx, `
INSERT INTO public.kategori_fee_app
  (kategori_id, fee_master, fee_agent, fee_user, fee_non_user, aktif, created_at, updated_at)
VALUES ($1,0,0,0,0,true,now(),now())
ON CONFLICT (kategori_id) DO NOTHING
`, categoryID); err != nil {
			return nil, err
		}

		var productID int64
		err = tx.QueryRowContext(ctx, `
INSERT INTO public.produk
  (sku, nama, group_name, kategori_id, brand_id, tipe_harga, nominal, maksimal_nominal, jam_buka, jam_tutup, aktif, dibuat_pada, diubah_pada)
VALUES ($1,$2,$3,$4,$5,$6,NULL,$7,'00:00','23:59',true,now(),now())
ON CONFLICT (sku) DO UPDATE SET
  nama = EXCLUDED.nama,
  group_name = EXCLUDED.group_name,
  kategori_id = EXCLUDED.kategori_id,
  brand_id = EXCLUDED.brand_id,
  tipe_harga = EXCLUDED.tipe_harga,
  maksimal_nominal = EXCLUDED.maksimal_nominal,
  aktif = true,
  diubah_pada = now()
RETURNING id
`, item.SKU, item.Name, item.GroupName, categoryID, brandID, item.PriceType, item.MaximumNominal).Scan(&productID)
		if err != nil {
			return nil, err
		}

		var catalogActive bool
		if err := tx.QueryRowContext(ctx, `
INSERT INTO public.produk_app_pricing
  (produk_id, provider, harga, harga_dasar, yuscom_group, yuscom_category, yuscom_sku, yuscom_name, yuscom_status, yuscom_display_brand, aktif, fetched_at, created_at, updated_at, dibuat_pada, diubah_pada)
VALUES ($1,'Pulsa24Jam',$2,$2,$3,$4,$5,$6,'ACTIVE',$7,true,now(),now(),now(),now(),now())
ON CONFLICT (produk_id) DO UPDATE SET
  provider = 'Pulsa24Jam',
  harga = EXCLUDED.harga,
  harga_dasar = EXCLUDED.harga_dasar,
  yuscom_group = EXCLUDED.yuscom_group,
  yuscom_category = EXCLUDED.yuscom_category,
  yuscom_sku = EXCLUDED.yuscom_sku,
  yuscom_name = EXCLUDED.yuscom_name,
  yuscom_status = 'ACTIVE',
  yuscom_display_brand = EXCLUDED.yuscom_display_brand,
  aktif = true,
  fetched_at = now(),
  updated_at = now(),
  diubah_pada = now()
RETURNING aktif
`, productID, item.Price, item.GroupName, item.CategoryName, item.SKU, item.Name, item.BrandName).Scan(&catalogActive); err != nil {
			return nil, err
		}

		var minimumNominal any
		if item.PriceType == "OPEN_AMOUNT" {
			minimumNominal = int64(1)
		}
		if _, err := tx.ExecContext(ctx, `
INSERT INTO public.produk_provider_map
  (produk_id, provider, kode_provider, mode, aktif, prioritas, minimal_nominal, maksimal_nominal, fee_rp, dibuat_pada, diubah_pada)
VALUES ($1,'Pulsa24Jam',$2,'normal',$5,1,$3,$4,0,now(),now())
ON CONFLICT (produk_id, provider, kode_provider) DO UPDATE SET
  mode = 'normal', aktif = EXCLUDED.aktif, prioritas = 1,
  minimal_nominal = EXCLUDED.minimal_nominal,
  maksimal_nominal = EXCLUDED.maksimal_nominal,
  fee_rp = 0, diubah_pada = now()
`, productID, item.SKU, minimumNominal, item.MaximumNominal, catalogActive); err != nil {
			return nil, err
		}
		synced++
	}
	if synced == 0 {
		return nil, fmt.Errorf("tidak ada produk Pulsa24Jam valid; sinkronisasi dibatalkan")
	}
	// Keep IDs and historical references; retire only masters without an active P24 product.
	for _, master := range []struct{ table, column string }{{"kategori", "kategori_id"}, {"brand", "brand_id"}} {
		query := fmt.Sprintf(`UPDATE public.%s m SET aktif = false, diubah_pada = now()
WHERE m.aktif = true AND NOT EXISTS (SELECT 1 FROM public.produk p WHERE p.%s = m.id AND p.aktif = true)`, master.table, master.column)
		if _, err := tx.ExecContext(ctx, query); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return &Pulsa24JamCatalogSyncResult{Synced: synced}, nil
}

func normalizePulsa24JamCatalogItem(item Pulsa24JamCatalogItem) Pulsa24JamCatalogItem {
	item.SKU = strings.TrimSpace(item.SKU)
	item.Name = strings.TrimSpace(item.Name)
	item.GroupName = strings.TrimSpace(item.GroupName)
	item.CategoryName = strings.TrimSpace(item.CategoryName)
	item.BrandName = strings.TrimSpace(item.BrandName)
	item.PriceType = strings.ToUpper(strings.TrimSpace(item.PriceType))
	return item
}

func validatePulsa24JamCatalog(items []Pulsa24JamCatalogItem) ([]Pulsa24JamCatalogItem, error) {
	if len(items) == 0 {
		return nil, fmt.Errorf("katalog Pulsa24Jam kosong; sinkronisasi dibatalkan")
	}
	validated := make([]Pulsa24JamCatalogItem, 0, len(items))
	seen := make(map[string]bool, len(items))
	for _, raw := range items {
		item := normalizePulsa24JamCatalogItem(raw)
		if item.SKU == "" || item.Name == "" || item.CategoryName == "" || item.BrandName == "" {
			return nil, fmt.Errorf("identitas katalog Pulsa24Jam tidak lengkap untuk SKU %q", item.SKU)
		}
		if item.PriceType != "FIXED" && item.PriceType != "OPEN_AMOUNT" {
			return nil, fmt.Errorf("tipe harga Pulsa24Jam tidak valid untuk SKU %q", item.SKU)
		}
		if item.Price < 0 || (item.MaximumNominal != nil && *item.MaximumNominal <= 0) {
			return nil, fmt.Errorf("harga/batas nominal Pulsa24Jam tidak valid untuk SKU %q", item.SKU)
		}
		key := strings.ToUpper(item.SKU)
		if seen[key] {
			return nil, fmt.Errorf("SKU Pulsa24Jam duplikat: %q", item.SKU)
		}
		seen[key] = true
		validated = append(validated, item)
	}
	return validated, nil
}

func ensureCatalogMaster(ctx context.Context, tx *sql.Tx, table, name string) (int64, error) {
	if table != "kategori" && table != "brand" {
		return 0, fmt.Errorf("master katalog tidak valid")
	}
	var id int64
	query := fmt.Sprintf(`SELECT id FROM public.%s WHERE LOWER(TRIM(nama)) = LOWER(TRIM($1)) ORDER BY id LIMIT 1`, table)
	err := tx.QueryRowContext(ctx, query, name).Scan(&id)
	if err == nil {
		_, err = tx.ExecContext(ctx, fmt.Sprintf(`UPDATE public.%s SET aktif = true, diubah_pada = now() WHERE id = $1`, table), id)
		return id, err
	}
	if err != sql.ErrNoRows {
		return 0, err
	}
	insert := fmt.Sprintf(`INSERT INTO public.%s (nama, aktif, dibuat_pada, diubah_pada) VALUES ($1,true,now(),now()) RETURNING id`, table)
	if err := tx.QueryRowContext(ctx, insert, name).Scan(&id); err != nil {
		return 0, err
	}
	return id, nil
}
