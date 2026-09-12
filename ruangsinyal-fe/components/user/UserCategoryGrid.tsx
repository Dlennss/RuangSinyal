"use client";

import { useMemo } from "react";
import type { UserCategoryItem } from "@/components/user/types";
import { CategoryShortcutLink } from "@/components/shared/CategoryShortcutLink";
import { getGuestCategoryPath } from "@/lib/category-routes";

type UserCategoryGridProps = {
  items: UserCategoryItem[];
  showAll?: boolean;
};

type CategoryCardProps = {
  item: UserCategoryItem;
};

const DEFAULT_SHORTCUTS = [
  { href: "/user/pulsa-data", label: "Pulsa", visualName: "pulsa" },
  { href: "/user/pulsa-data", label: "Paket Data", visualName: "paket data" },
  { href: "/user/kategori", label: "Telepon", visualName: "telepon" },
  { href: "/user/kategori", label: "SMS", visualName: "sms" },
  { href: "/user/ewallet", label: "E-Wallet", visualName: "e-money" },
];

const PRIORITY: Record<string, number> = {
  pulsa: 1,
  "paket data": 1,
  game: 2,
  "e-money": 3,
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

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function getCategoryHref(item: UserCategoryItem) {
  const name = normalizeName(item.nama);
  if (name === "pulsa" || name === "paket data") return "/user/pulsa-data";
  return getGuestCategoryPath(item).replace(/^\/kategori\//, "/user/kategori/");
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
  if (name === "e-money") {
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

export function UserCategoryGrid({ items, showAll = false }: UserCategoryGridProps) {
  const sortedItems = useMemo(() => sortCategories(items), [items]);

  return (
    <section>
      <div className="rounded-[18px] border border-white bg-white/92 px-2 pb-3 pt-4 shadow-[0_14px_32px_rgba(6,43,116,0.10)] ring-1 ring-sky-100/80 backdrop-blur">
        <div className={showAll ? "grid grid-cols-3 gap-2.5" : "grid grid-cols-5 gap-x-1 gap-y-3"}>
          {!showAll
            ? DEFAULT_SHORTCUTS.map((item) => (
                <CategoryShortcutLink
                  key={item.label}
                  href={item.href}
                  label={item.label}
                  visualName={item.visualName}
                />
              ))
            : null}
          {showAll
            ? sortedItems.map((item) => (
                <CategoryCard key={item.id} item={item} />
              ))
            : null}
        </div>
      </div>
    </section>
  );
}
