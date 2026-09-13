import Link from "next/link";
import { ChevronRight, ReceiptText } from "lucide-react";
import type { ReactNode } from "react";
import { UserTransactionStatusBadge } from "@/components/user/UserTransactionStatusBadge";

type Props = { href: string; title: string; invoiceId: string; destination: string; amount: number; date?: string | null; status: string; action?: ReactNode };

export function TransactionHistoryRow({ href, title, invoiceId, destination, amount, date, status, action }: Props) {
  const parsedDate = date ? new Date(date) : null;
  const displayDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(parsedDate) : "-";
  return (
    <article className="overflow-hidden rounded-lg border border-sky-100 bg-white shadow-[0_3px_12px_rgba(8,76,120,0.05)]">
      <Link href={href} className="block p-3.5 !text-slate-900 transition hover:bg-sky-50/60 focus-visible:outline-2 focus-visible:outline-sky-600">
        <div className="flex items-start gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600"><ReceiptText className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-semibold leading-5">{title || "Transaksi"}</h3>
            <p className="mt-0.5 break-all text-xs text-slate-500">{destination || invoiceId}</p>
          </div>
          <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="break-all text-base font-bold tabular-nums">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount || 0)}</p>
          <UserTransactionStatusBadge status={status} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-100 pt-2 text-[11px] leading-4 text-slate-500">
          <span className="break-all">{invoiceId}</span>
          <time dateTime={parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined}>{displayDate}</time>
        </div>
      </Link>
      {action ? <div className="flex justify-end border-t border-slate-100 px-2">{action}</div> : null}
    </article>
  );
}
