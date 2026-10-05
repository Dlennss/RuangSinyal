BEGIN;

SELECT pg_advisory_xact_lock(7242401);

-- The imported all-day schedule must include the entire final minute.
-- Preserve custom schedules, product availability, prices, and financial records.
UPDATE public.produk p
SET jam_tutup = TIME '23:59:59.999999', diubah_pada = now()
WHERE p.jam_buka = TIME '00:00'
  AND p.jam_tutup = TIME '23:59'
  AND EXISTS (
    SELECT 1 FROM public.produk_app_pricing a
    WHERE a.produk_id = p.id AND LOWER(TRIM(a.provider)) = 'pulsa24jam'
  );

COMMIT;
