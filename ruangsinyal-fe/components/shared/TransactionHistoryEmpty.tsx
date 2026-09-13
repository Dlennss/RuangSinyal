import Image from "next/image";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";

type Props = { filtered: boolean; onReset?: () => void; servicesHref: string };

export function TransactionHistoryEmpty({ filtered, onReset, servicesHref }: Props) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-3 py-7 text-center" role="status">
      <Image src="/ruangsinyal-assets/logo_mark_512.png" alt="" width={56} height={56} className="mb-4 h-14 w-14 rounded-lg border border-sky-100 bg-white p-2 shadow-[0_4px_14px_rgba(8,118,206,0.10)]" />
      <h2 className="text-base font-semibold text-slate-900">{filtered ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}</h2>
      <p className="mt-1.5 max-w-64 text-sm leading-5 text-slate-500">{filtered ? "Tidak ada transaksi yang cocok dengan filter ini." : "Riwayat pembelian Anda masih kosong."}</p>
      {filtered ? (
        <button type="button" onClick={onReset} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-sky-200 bg-white px-4 text-sm font-semibold !text-sky-700 hover:bg-sky-50"><RotateCcw className="h-4 w-4" /> Reset filter</button>
      ) : (
        <Link href={servicesHref} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0876CE] px-4 text-sm font-semibold !text-white shadow-sm hover:bg-[#0665B2]">Lihat layanan <ArrowRight className="h-4 w-4" /></Link>
      )}
    </div>
  );
}
