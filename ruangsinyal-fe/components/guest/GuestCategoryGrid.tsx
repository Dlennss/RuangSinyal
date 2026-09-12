"use client";

import { useMemo } from "react";
import type { UserCategoryItem } from "@/components/user/types";
import { getGuestCategoryPath } from "@/lib/category-routes";
import { CategoryShortcutLink } from "@/components/shared/CategoryShortcutLink";

type GuestCategoryGridProps = {
  items: UserCategoryItem[];
  showAll?: boolean;
};

type CategoryCardProps = {
  item: UserCategoryItem;
};

type HomeShortcut = {
  href: string;
  label: string;
  visualName: string;
};

const PRIORITY: Record<string, number> = {
  pulsa: 1,
  "paket data": 1,
  game: 2,
  "e-money": 3,
  "e-wallet": 3,
  listrik: 4,
  pln: 4,
  tv: 6,
  pdam: 7,
  bpjs: 8,
  "internet pascabayar": 9,
  "hp pascabayar": 10,
  "masa aktif": 11,
  "paket telepon": 12,
  "aktivasi perdana": 13,
  "gas negara": 14,
  lainnya: 15,
};

const HOME_SHORTCUTS: HomeShortcut[] = [
  { href: "/pulsa", label: "Pulsa", visualName: "Pulsa" },
  { href: "/paket-data", label: "Paket Data", visualName: "Paket Data" },
  { href: "/paket-telepon", label: "Telepon", visualName: "Telepon" },
  { href: "/masa-aktif", label: "SMS", visualName: "SMS" },
  { href: "/ewallet", label: "E-Wallet", visualName: "E-Wallet" },
];

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function getCategoryHref(item: UserCategoryItem) {
  const name = normalizeName(item.nama);
  if (name === "pulsa" || name === "paket data") return "/pulsa-data";
  return getGuestCategoryPath(item);
}

function sortCategories(items: UserCategoryItem[]) {
  return items
  .filter((item) => normalizeName(item.nama) !== "paket data")
  .sort((a, b) => {
    const aKey = normalizeName(a.nama);
    const bKey = normalizeName(b.nama);
    const pa = PRIORITY[aKey] ?? 999;
    const pb = PRIORITY[bKey] ?? 999;
    if (pa !== pb) return pa - pb;
    return a.nama.localeCompare(b.nama, "id-ID");
  });
}

function getCategoryLabel(item: UserCategoryItem) {
  const name = normalizeName(item.nama);
  if (name === "pulsa") {
    return "Pulsa & Data";
  }
  if (name === "e-money" || name === "e-wallet") {
    return "E-Wallet";
  }
  return item.nama;
}

function getCategoryVisualName(item: UserCategoryItem) {
  return normalizeName(item.nama) === "pulsa" ? "pulsa data" : item.nama;
}

function CategoryCard({ item }: CategoryCardProps) {
  const label = getCategoryLabel(item);

  return (
    <CategoryShortcutLink href={getCategoryHref(item)} label={label} visualName={getCategoryVisualName(item)} />
  );
}

export function GuestCategoryGrid({ items, showAll = false }: GuestCategoryGridProps) {
  const sortedItems = useMemo(() => sortCategories(items), [items]);

  return (
    <section>
      <div className="rounded-[18px] border border-white bg-white/92 px-4 pb-3 pt-4 shadow-[0_14px_32px_rgba(6,43,116,0.10)] ring-1 ring-sky-100/80 backdrop-blur">
        <div className={showAll ? "grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-5" : "grid grid-cols-5 gap-x-2 gap-y-3"}>
          {!showAll ? HOME_SHORTCUTS.map((item) => (
            <CategoryShortcutLink key={item.label} href={item.href} label={item.label} visualName={item.visualName} />
          )) : null}
          {showAll ? sortedItems.map((item) => (
            <CategoryCard key={item.id} item={item} />
          )) : null}
        </div>
      </div>
    </section>
  );
}
