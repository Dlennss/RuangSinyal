"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductCategoryTabs({ groups, brandName, value, onChange }: {
  groups: { label: string; items: unknown[] }[];
  brandName?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label="Kategori produk" className="mb-3 flex w-full min-w-0 items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {[{ label: "" }, ...groups].map(({ label }) => {
        const name = label ? [brandName, label].filter(Boolean).join(" ") : "Semua";
        const selected = value === label;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={selected}
            onClick={(event) => {
              onChange(label);
              const button = event.currentTarget;
              const strip = button.parentElement;
              if (strip) strip.scrollBy({ left: button.getBoundingClientRect().left - strip.getBoundingClientRect().left - (strip.clientWidth - button.offsetWidth) / 2 });
            }}
            className={`flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-3 text-[10px] font-semibold uppercase leading-none transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-400 ${selected ? "border-[#287AC7] bg-[#287AC7] text-white" : "border-sky-100 bg-white text-slate-800 hover:bg-sky-50"}`}
          >
            {name}
          </button>
        );
      })}
    </div>
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
