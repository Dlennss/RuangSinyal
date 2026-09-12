"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type BottomNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  badge?: ReactNode;
};

export function BottomNav({ items }: { items: BottomNavItem[] }) {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none h-[calc(94px+env(safe-area-inset-bottom))]" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] mx-auto w-full max-w-md px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 md:w-97.5">
        <nav
          aria-label="Navigasi utama"
          className="pointer-events-auto grid h-[72px] grid-cols-5 items-stretch rounded-[22px] border border-sky-100 bg-white px-1 py-1.5 shadow-[0_-4px_20px_rgba(22,138,242,0.08)]"
        >
          {items.map(({ label, href, icon: Icon, active, badge }) => (
            <Link
              key={label}
              href={href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={`group flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl no-underline! outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 motion-reduce:transition-none ${
                active
                  ? "text-[#0876CE]! visited:text-[#0876CE]!"
                  : "text-[#60738E]! visited:text-[#60738E]! hover:text-[#0876CE]!"
              }`}
            >
              <span className={`relative flex h-8 w-12 shrink-0 items-center justify-center rounded-xl transition-colors motion-reduce:transition-none ${active ? "bg-sky-100" : "group-hover:bg-sky-50"}`}>
                <Icon aria-hidden="true" className="h-6 w-6 shrink-0" strokeWidth={2} />
                {badge}
              </span>
              <span className="block max-w-full whitespace-nowrap text-[11px] font-semibold leading-4 tracking-normal">
                {label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
