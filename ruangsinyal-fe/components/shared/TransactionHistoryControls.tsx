"use client";

import { CalendarDays, ReceiptText, RotateCcw, Search } from "lucide-react";

type Props = {
  query: string;
  range: string;
  date: string;
  onQueryChange: (value: string) => void;
  onRangeChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onReset: () => void;
};

export function TransactionHistoryControls({ query, range, date, onQueryChange, onRangeChange, onDateChange, onReset }: Props) {
  const filtered = Boolean(query || date || range !== "Semua");
  return (
    <header className="space-y-4 border-b border-sky-100 pb-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-sky-100 bg-white text-sky-600 shadow-sm"><ReceiptText className="h-6 w-6" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-sky-700">Aktivitas pembelian</p>
          <h1 className="mt-0.5 text-xl font-bold leading-7 tracking-normal text-slate-950">Riwayat Transaksi</h1>
        </div>
      </div>
      <label className="flex h-12 items-center gap-2.5 rounded-lg border border-sky-100 bg-white px-3 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
        <Search className="h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} aria-label="Cari transaksi" placeholder="Cari nomor, produk, atau ID" className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
      </label>
      <div role="group" aria-label="Periode transaksi" className="grid grid-cols-4 gap-1 rounded-lg bg-sky-100/70 p-1">
        {["Semua", "Hari ini", "Kemarin", "7 Hari"].map((label) => (
          <button key={label} type="button" aria-pressed={range === label && !date} onClick={() => onRangeChange(label)} className={`h-10 min-w-0 rounded-md text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-sky-600 ${range === label && !date ? "bg-white !text-sky-700 shadow-sm" : "!text-slate-600 hover:bg-white/60"}`}>{label}</button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Tanggal transaksi</span>
          <span className="flex h-11 items-center gap-2 rounded-lg border border-sky-100 bg-white px-3 focus-within:ring-2 focus-within:ring-sky-200">
            <CalendarDays className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
            <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} aria-label="Pilih tanggal transaksi" className="h-full min-w-0 w-full bg-transparent text-sm text-slate-700 outline-none [color-scheme:light]" />
          </span>
        </label>
        <button type="button" onClick={onReset} disabled={!filtered} aria-label="Reset filter" title="Reset filter" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-sky-100 bg-white text-sky-700 transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600 disabled:text-slate-300"><RotateCcw className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </header>
  );
}
