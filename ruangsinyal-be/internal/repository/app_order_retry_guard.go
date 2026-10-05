package repository

import "context"

// Only throttle the same customer's rejected purchase, never an entire operator.
func (r *AppOrderRepository) HasRecentP24Rejection(ctx context.Context, memberID, productID, qty int64, dest string) (bool, error) {
	var found bool
	err := r.db.QueryRowContext(ctx, `
SELECT EXISTS (
  SELECT 1 FROM public.app_order o
  JOIN public.app_order_provider_trx a ON a.app_order_id = o.id
  WHERE o.member_id = $1 AND o.produk_id = $2 AND o.qty = $3 AND o.dest = $4
    AND o.status IN ('failed','refunded')
    AND LOWER(a.provider) = 'pulsa24jam' AND a.status = 'failed'
    AND a.diubah_pada > now() - interval '5 minutes'
)`, memberID, productID, qty, dest).Scan(&found)
	return found, err
}
