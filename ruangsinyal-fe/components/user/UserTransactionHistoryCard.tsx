import type { UserAppOrder } from "@/components/user/types";
import { TransactionHistoryRow } from "@/components/shared/TransactionHistoryRow";

export function UserTransactionHistoryCard({ item }: { item: UserAppOrder }) {
  return <TransactionHistoryRow href={`/user/transaksi/${encodeURIComponent(item.invoice_id)}`} title={item.produk_nama_snapshot}
    invoiceId={item.invoice_id} destination={item.dest} amount={item.harga_final} date={item.dibuat_pada} status={item.status} />;
}
