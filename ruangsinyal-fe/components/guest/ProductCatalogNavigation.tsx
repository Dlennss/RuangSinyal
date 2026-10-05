"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductCategorySelect({ groups, total, value, onChange }: {
  groups: { label: string; items: unknown[] }[];
  total: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mb-3 block text-xs font-semibold text-slate-600">
      Kategori produk
      <select aria-label="Kategori produk" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-11 w-full min-w-0 rounded-lg border border-sky-200 bg-white px-3 text-sm text-slate-900">
        <option value="">Semua produk ({total})</option>
        {groups.map((group) => <option key={group.label} value={group.label}>{group.label} ({group.items.length})</option>)}
      </select>
    </label>
  );
}

export function ProductPagination({ page, totalPages, total, start, end, onChange }: {
  page: number; totalPages: number; total: number; start: number; end: number;
  onChange: (page: number) => void;
}) {
  if (!total) return null;
  return (
    <nav aria-label="Halaman produk" className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sky-100 py-3 text-xs text-slate-600">
      <span aria-live="polite">{start}-{end} dari {total} produk</span>
      {totalPages > 1 ? <div className="flex items-center gap-2">
        <button type="button" title="Halaman sebelumnya" aria-label="Halaman sebelumnya" disabled={page === 1} onClick={() => onChange(page - 1)} className="grid h-10 w-10 place-items-center rounded-md border border-sky-200 bg-white text-sky-700 disabled:opacity-35"><ChevronLeft className="h-4 w-4" /></button>
        <span className="min-w-10 text-center tabular-nums">{page}/{totalPages}</span>
        <button type="button" title="Halaman berikutnya" aria-label="Halaman berikutnya" disabled={page === totalPages} onClick={() => onChange(page + 1)} className="grid h-10 w-10 place-items-center rounded-md border border-sky-200 bg-white text-sky-700 disabled:opacity-35"><ChevronRight className="h-4 w-4" /></button>
      </div> : null}
    </nav>
  );
}
