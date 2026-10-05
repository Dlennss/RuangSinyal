"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { UserCategoryItem } from "@/components/user/types";
import { CategoryShortcutLink } from "@/components/shared/CategoryShortcutLink";
import { getGuestCategoryPath } from "@/lib/category-routes";

type ServiceDirectoryProps = {
  mode?: "guest" | "user";
  items: UserCategoryItem[];
};

export function ServiceDirectory({ mode = "guest", items }: ServiceDirectoryProps) {
  const [query, setQuery] = useState("");
  const categories = items.filter((item) => item.aktif !== false && item.nama.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="space-y-5 pb-6">
      <h1 className="text-xl font-bold text-slate-900">Semua Layanan</h1>
      <label className="flex items-center gap-3 rounded-lg border border-sky-200 bg-white px-3 py-3">
        <Search className="h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
        <input type="search" aria-label="Cari layanan" placeholder="Cari layanan" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </label>
      <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">
        {categories.map((item) => {
          const guestPath = getGuestCategoryPath(item);
          return <CategoryShortcutLink key={item.id} href={mode === "user" ? `/user${guestPath}` : guestPath} label={item.nama} visualName={item.nama} />;
        })}
      </div>
      {categories.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">{query ? "Layanan tidak ditemukan." : "Belum ada layanan aktif."}</p> : null}
    </section>
  );
}
