"use client";

import Image from "next/image";
import Link from "next/link";
import { getBrandLogo } from "@/lib/brand-logos";
import type { UserBrandItem } from "@/components/user/types";

type ProviderBrandPickerProps = {
  items: Array<{
    brand: UserBrandItem;
    href: string;
  }>;
  layout?: "grid" | "list";
  columns?: 2 | 3;
};

export function ProviderBrandPicker({ items, layout = "grid", columns = 3 }: ProviderBrandPickerProps) {
  return (
    <section className={layout === "list" ? "space-y-2" : columns === 2 ? "grid grid-cols-2 gap-3" : "grid grid-cols-3 gap-3"}>
      {items.map(({ brand, href }) => {
        const logo = getBrandLogo(brand.nama);
        return (
          <Link
            key={brand.id}
            href={href}
            aria-label={brand.nama}
            className={
              layout === "list"
                ? "group flex items-center gap-3 rounded-2xl border border-sky-100/80 bg-white px-3 py-3 shadow-[0_8px_18px_rgba(22,138,242,0.06)] transition-transform duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_12px_26px_rgba(215,7,23,0.10)]"
                : "group rounded-2xl border border-sky-100/80 bg-white px-2 py-3 text-center shadow-[0_8px_18px_rgba(22,138,242,0.06)] transition-transform duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_12px_26px_rgba(215,7,23,0.10)]"
            }
          >
            <div className={layout === "list" ? "grid h-12 w-12 shrink-0 place-items-center overflow-hidden" : "flex flex-col items-center gap-3"}>
              <div className={layout === "list" ? "grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-white" : "grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-white"}>
                {logo ? (
                  <Image src={logo.src} alt={logo.alt} title={logo.alt} width={56} height={56} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-base font-black uppercase tracking-tight text-[#e50b18]">{brand.nama.slice(0, 2)}</span>
                )}
              </div>
            </div>
            {layout === "list" ? <span className="min-w-0 text-sm font-semibold text-slate-900">{brand.nama}</span> : null}
          </Link>
        );
      })}
    </section>
  );
}
