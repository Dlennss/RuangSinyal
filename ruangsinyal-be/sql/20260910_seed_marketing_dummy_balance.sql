BEGIN;

INSERT INTO public.dompet_member (member_id, saldo)
SELECT id, 0
FROM public.member
WHERE lower(email) = 'marketing@ruangsinyal.com'
  AND lower(COALESCE(role, '')) = 'marketing'
ON CONFLICT (member_id) DO NOTHING;

WITH locked_wallet AS (
  SELECT d.member_id, d.saldo AS saldo_sebelum
  FROM public.dompet_member d
  JOIN public.member m ON m.id = d.member_id
  WHERE lower(m.email) = 'marketing@ruangsinyal.com'
    AND lower(COALESCE(m.role, '')) = 'marketing'
  FOR UPDATE OF d
),
seed_delta AS (
  SELECT
    member_id,
    saldo_sebelum,
    1000000::BIGINT AS saldo_sesudah,
    (1000000 - saldo_sebelum)::BIGINT AS jumlah
  FROM locked_wallet
  WHERE saldo_sebelum < 1000000
    AND NOT EXISTS (
      SELECT 1
      FROM public.mutasi_dompet
      WHERE member_id = locked_wallet.member_id
        AND ref_id = 'DUMMY-MARKETING-BALANCE-20260910'
    )
),
updated_wallet AS (
  UPDATE public.dompet_member d
  SET saldo = s.saldo_sesudah,
      diperbarui_pada = now()
  FROM seed_delta s
  WHERE d.member_id = s.member_id
  RETURNING s.member_id, s.jumlah, s.saldo_sebelum, s.saldo_sesudah
)
INSERT INTO public.mutasi_dompet
  (member_id, ref_id, arah, jumlah, alasan, catatan, saldo_sebelum, saldo_sesudah, dibuat_pada)
SELECT
  member_id,
  'DUMMY-MARKETING-BALANCE-20260910',
  'CREDIT',
  jumlah,
  'DUMMY_TEST_BALANCE',
  'Saldo dummy untuk tes produk RuangSinyal',
  saldo_sebelum,
  saldo_sesudah,
  now()
FROM updated_wallet;

COMMIT;
