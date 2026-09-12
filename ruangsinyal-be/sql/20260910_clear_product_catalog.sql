BEGIN;

CREATE TABLE IF NOT EXISTS public.app_runtime_flag (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF to_regclass('public.member_fee_produk') IS NOT NULL THEN
    DELETE FROM public.member_fee_produk;
  END IF;
  IF to_regclass('public.produk_fee_provider') IS NOT NULL THEN
    DELETE FROM public.produk_fee_provider;
  END IF;
  IF to_regclass('public.produk_provider_map') IS NOT NULL THEN
    DELETE FROM public.produk_provider_map;
  END IF;
  IF to_regclass('public.produk_app_pricing') IS NOT NULL THEN
    DELETE FROM public.produk_app_pricing;
  END IF;
  IF to_regclass('public.kategori_fee_app') IS NOT NULL THEN
    DELETE FROM public.kategori_fee_app;
  END IF;
  IF to_regclass('public.yuscom_produk_snapshot') IS NOT NULL THEN
    DELETE FROM public.yuscom_produk_snapshot;
  END IF;
END $$;

UPDATE public.produk
SET aktif = false,
    kategori_id = NULL,
    brand_id = NULL,
    diubah_pada = now();

DO $$
BEGIN
  IF to_regclass('public.app_order') IS NOT NULL AND to_regclass('public.app_billing_check') IS NOT NULL THEN
    DELETE FROM public.produk p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.app_order o WHERE o.produk_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.app_billing_check b WHERE b.produk_id = p.id
    );
  END IF;
END $$;

DELETE FROM public.brand;
DELETE FROM public.kategori;

INSERT INTO public.app_runtime_flag (key, value, updated_at)
VALUES ('product_catalog_cleared', 'true', now())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

COMMIT;
