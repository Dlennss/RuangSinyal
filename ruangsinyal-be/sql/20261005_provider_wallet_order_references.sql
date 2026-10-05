BEGIN;

ALTER TABLE public.mutasi_dompet_provider
  ADD COLUMN IF NOT EXISTS transaksi_member_id BIGINT,
  ADD COLUMN IF NOT EXISTS transaksi_provider_id BIGINT,
  ADD COLUMN IF NOT EXISTS app_order_provider_trx_id BIGINT;

COMMIT;
