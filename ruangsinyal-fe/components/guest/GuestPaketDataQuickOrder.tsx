"use client";

import * as React from "react";
import { LoaderCircle, Search } from "lucide-react";
import type { UserBrandItem, UserProductItem } from "@/components/user/types";
import { UserCheckoutModal } from "@/components/user/UserCheckoutModal";
import { PaketDataEntryCard } from "@/components/guest/PaketDataEntryCard";
import { ProviderBrandPicker } from "@/components/guest/ProviderBrandPicker";
import { QuickProductOptionGrid } from "@/components/guest/QuickProductOptionGrid";
import { getDedicatedGuestBrandPath } from "@/lib/dedicated-category-brand-routes";
import { findDetectedOperatorBrand, normalizeOperatorDigits } from "@/lib/operator-brand-detection";
import { filterAndSortFixedProducts, getDisplayProductName, getDisplayedFixedPrice, type CatalogPriceSort } from "@/components/guest/product-card-shared";
import { getProductGroupLabel } from "@/lib/product-grouping";

type GuestPaketDataQuickOrderProps = {
  kategoriId: string;
  brands: UserBrandItem[];
  authToken?: string;
  buyerRole?: string;
  brandHrefPrefix?: string;
  forcedBrand?: UserBrandItem;
  title?: string;
  productLabel?: string;
  showBrandPicker?: boolean;
  showGroupTabs?: boolean;
};

function formatNominal(value: number) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

async function getClientProductsByBrand(kategoriId: string, brandId: string): Promise<UserProductItem[]> {
  const res = await fetch(`/api/app/produk?kategori_id=${encodeURIComponent(kategoriId)}&brand_id=${encodeURIComponent(brandId)}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil produk paket data (${res.status})`);
  }

  const json = (await res.json().catch(() => ({}))) as { items?: UserProductItem[] };
  return Array.isArray(json.items) ? json.items : [];
}

function normalizeGroupLabel(item: UserProductItem) {
  const fromGroup = getProductGroupLabel(item, "");
  if (fromGroup) return fromGroup;

  const brandUpper = String(item.brand_nama || "").toUpperCase();
  const upper = String(item.nama || "").toUpperCase();
  let cleaned = upper;
  if (brandUpper && cleaned.startsWith(`${brandUpper} `)) {
    cleaned = cleaned.slice(brandUpper.length).trim();
  }

  const category = String(item.kategori_nama || "").toUpperCase().trim();
  if (category) {
    cleaned = cleaned.replace(category, "").trim();
  }

  cleaned = cleaned
    .replace(/\bPAKET DATA\b/g, "")
    .replace(/\bINTERNET\b/g, "")
    .replace(/\b\d+(?:\.\d+)?\s*(GB|MB|TB|HARI|HR|GB\+|MB\+)\b/g, "")
    .replace(/\b\d{1,3}(?:\.\d{3})+\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned) return cleaned;

  if (category) {
    return category.replace(/\bPAKET DATA\b/g, "").replace(/\s+/g, " ").trim() || "REGULER";
  }

  return "REGULER";
}

function getGroupPriority(label: string) {
  const upper = label.toUpperCase();
  if (upper.includes("PURE")) return -1;
  if (upper.includes("REGULER")) return 0;
  if (upper.includes("UNLIMITED")) return 1;
  if (upper.includes("SOSMED") || upper.includes("SOCIAL")) return 2;
  if (upper.includes("GAME")) return 3;
  if (upper.includes("YOUTUBE") || upper.includes("VIDEO")) return 4;
  if (upper.includes("CHAT")) return 5;
  if (upper.includes("MALAM")) return 6;
  return 7;
}

export function GuestPaketDataQuickOrder({
  kategoriId,
  brands,
  authToken,
  buyerRole,
  brandHrefPrefix = "/kategori",
  forcedBrand,
  title = "Paket Data",
  productLabel = "paket data",
  showBrandPicker = true,
  showGroupTabs = true,
}: GuestPaketDataQuickOrderProps) {
  const [phone, setPhone] = React.useState("");
  const [products, setProducts] = React.useState<UserProductItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<CatalogPriceSort>("name");
  const [loadError, setLoadError] = React.useState(false);
  const [reload, setReload] = React.useState(0);
  const [selectedProduct, setSelectedProduct] = React.useState<UserProductItem | null>(null);
  const cacheRef = React.useRef<Record<string, UserProductItem[]>>({});
  const allowedKategoriId = React.useMemo(() => Number(kategoriId), [kategoriId]);

  const detectedBrand = React.useMemo(() => {
    if (forcedBrand) return forcedBrand;
    return findDetectedOperatorBrand(phone, brands);
  }, [forcedBrand, phone, brands]);
  const normalizedPhone = React.useMemo(() => normalizeOperatorDigits(phone), [phone]);
  React.useEffect(() => {
    setSelectedGroup("");
    setSearch("");
    setLoadError(false);
    if (!detectedBrand?.id) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const cacheKey = `${kategoriId}:${detectedBrand.id}`;
    const cached = cacheRef.current[cacheKey];
    if (cached) {
      setProducts(cached);
      setLoading(false);
      return;
    }

    let active = true;
    setProducts([]);
    setLoading(true);
    void getClientProductsByBrand(kategoriId, String(detectedBrand.id))
      .then((rows) => {
        if (!active) return;
        const available = rows.filter((item) => item.aktif !== false && item.tipe_harga === "FIXED" && Number(item.kategori_id) === allowedKategoriId);
        cacheRef.current[cacheKey] = available;
        setProducts(available);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
        setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [allowedKategoriId, detectedBrand?.id, kategoriId, reload]);

  const groupedProducts = React.useMemo(() => {
    const grouped = new Map<string, UserProductItem[]>();
    for (const item of products) {
      const label = normalizeGroupLabel(item);
      const bucket = grouped.get(label) || [];
      bucket.push(item);
      grouped.set(label, bucket);
    }

    return Array.from(grouped.entries())
      .map(([label, items]) => ({
        label,
        items,
      }))
      .sort((a, b) => {
        const priority = getGroupPriority(a.label) - getGroupPriority(b.label);
        if (priority !== 0) return priority;
        return a.label.localeCompare(b.label);
      });
  }, [products]);

  React.useEffect(() => {
    if (!groupedProducts.length) {
      setSelectedGroup("");
      return;
    }

    setSelectedGroup((current) => {
      if (current && groupedProducts.some((group) => group.label === current)) return current;
      return "";
    });
  }, [groupedProducts]);

  const effectiveRole = buyerRole || (authToken ? "user" : "guest");
  const activeProducts = React.useMemo(() => {
    const items = showGroupTabs && selectedGroup
      ? groupedProducts.find((group) => group.label === selectedGroup)?.items || products
      : products;
    return filterAndSortFixedProducts(items, search, sort, effectiveRole);
  }, [products, groupedProducts, selectedGroup, showGroupTabs, search, sort, effectiveRole]);
  const useCatalogCards = Boolean(detectedBrand);

  return (
    <>
      <div className="space-y-4">
        <PaketDataEntryCard phone={phone} onPhoneChange={setPhone} detectedBrand={detectedBrand} title={title} />

        <section className="">
            {showBrandPicker && !detectedBrand && !forcedBrand ? (
            <div className="space-y-3">
              <ProviderBrandPicker
                items={brands.map((brand) => ({
                  brand,
                  href:
                    brandHrefPrefix === "/kategori"
                      ? getDedicatedGuestBrandPath(kategoriId, brand) || `${brandHrefPrefix}/${kategoriId}/brand/${brand.id}?name=${encodeURIComponent(brand.nama)}`
                      : `${brandHrefPrefix}/${kategoriId}/brand/${brand.id}?name=${encodeURIComponent(brand.nama)}`,
                }))}
              />
            </div>
          ) : null}

          {detectedBrand ? (
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-sky-600" /> : null}
              </div>

              {showGroupTabs && groupedProducts.length > 1 ? (
                <div className="mb-3 flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[{ label: "", items: products }, ...groupedProducts].map((group) => (
                    <button
                      type="button"
                      key={group.label}
                      onClick={() => setSelectedGroup(group.label)}
                      aria-pressed={selectedGroup === group.label}
                      className={`shrink-0 snap-start whitespace-nowrap rounded-full px-2.5 py-2 text-[10px] font-semibold leading-tight transition ${
                        selectedGroup === group.label
                          ? "bg-sky-600 text-white shadow-[0_8px_18px_rgba(15,111,203,0.22)]"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {group.label || "Semua"} ({group.items.length})
                    </button>
                  ))}
                </div>
              ) : null}

              {!loading && products.length > 0 ? (
                <div className="mb-3 space-y-2">
                  <label className="flex min-h-11 items-center gap-2 rounded-lg border border-sky-200 bg-white px-3">
                    <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-600" />
                    <input aria-label="Cari nama atau SKU produk" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau SKU produk" className="min-w-0 w-full bg-transparent py-2 text-sm text-slate-900 outline-none" />
                  </label>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                    <span aria-live="polite">{activeProducts.length} produk</span>
                    <select aria-label="Urutkan produk" value={sort} onChange={(event) => setSort(event.target.value as CatalogPriceSort)} className="min-h-10 max-w-[65%] rounded-md border border-sky-100 bg-white px-2 text-slate-700">
                      <option value="name">Nama A-Z</option>
                      <option value="price-asc">Harga terendah</option>
                      <option value="price-desc">Harga tertinggi</option>
                    </select>
                  </div>
                </div>
              ) : null}

              {loading ? (
                <div className="grid min-h-28 place-items-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  Memuat produk {productLabel}...
                </div>
              ) : loadError ? (
                <div className="py-6 text-center text-sm text-slate-600">
                  <p>Harga produk gagal dimuat.</p>
                  <button type="button" onClick={() => setReload((value) => value + 1)} className="mt-2 rounded-md bg-sky-600 px-4 py-2 font-semibold text-white">Coba lagi</button>
                </div>
              ) : activeProducts.length > 0 ? (
                <QuickProductOptionGrid
                  items={activeProducts.map((item) => ({
                    id: item.id,
                    title: (
                      <div className="w-full text-left">
                        <p className="break-words text-[13px] font-bold leading-snug text-white">{getDisplayProductName(item)}</p>
                        <p className="mt-1 break-all font-mono text-[10px] font-normal text-white">{item.sku}</p>
                      </div>
                    ),
                    subtitle: (
                      <div className="mt-3 space-y-1 text-left">
                        <p className="text-[10px] font-normal">Harga produk</p>
                        <p className="text-base font-bold">Rp {formatNominal(getDisplayedFixedPrice(item, effectiveRole))}</p>
                        <p className="text-[10px] font-normal">P24 Rp {formatNominal(item.harga_dasar_app)}</p>
                        <p className="text-[10px] font-normal">Fee aplikasi Rp {formatNominal(getDisplayedFixedPrice(item, effectiveRole) - item.harga_dasar_app)}</p>
                      </div>
                    ),
                  }))}
                  columns={useCatalogCards ? 2 : 1}
                  variant={useCatalogCards ? "pulsa" : "default"}
                  onSelect={(id) => {
                    const found = activeProducts.find((item) => item.id === id) || null;
                    setSelectedProduct(found);
                  }}
                />
              ) : (
                <div className="grid min-h-28 place-items-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  {products.length ? "Produk tidak ditemukan." : "Belum ada produk aktif untuk operator ini."}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>

      <UserCheckoutModal
        open={Boolean(selectedProduct)}
        product={selectedProduct}
        authToken={authToken}
        buyerRole={buyerRole}
        initialDest={normalizedPhone}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
