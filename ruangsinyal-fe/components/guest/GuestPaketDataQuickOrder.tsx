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
import { getCatalogPage, groupCatalogProducts } from "@/lib/product-grouping";
import { ProductCategoryTabs, ProductPagination } from "@/components/guest/ProductCatalogNavigation";

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
  const [page, setPage] = React.useState(1);
  const catalogRef = React.useRef<HTMLDivElement>(null);
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

  const groupedProducts = React.useMemo(() => groupCatalogProducts(products), [products]);

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
  React.useEffect(() => { setPage(1); }, [activeProducts]);
  const pagination = getCatalogPage(activeProducts, page);
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
            <div ref={catalogRef} className="scroll-mt-20">
              <div className="mb-2 flex items-center justify-between gap-3">
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-sky-600" /> : null}
              </div>

              {showGroupTabs && products.length > 0 ? <ProductCategoryTabs groups={groupedProducts} brandName={detectedBrand.nama} value={selectedGroup} onChange={setSelectedGroup} /> : null}

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
                  items={pagination.items.map((item) => ({
                    id: item.id,
                    title: (
                      <p className="w-full break-words text-left text-[13px] font-semibold leading-snug text-white">{getDisplayProductName(item)}</p>
                    ),
                    subtitle: (
                      <p className="mt-3 text-left text-base font-bold">Rp {formatNominal(getDisplayedFixedPrice(item, effectiveRole))}</p>
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
              {!loading && !loadError ? <ProductPagination {...pagination} onChange={(next) => { setPage(next); catalogRef.current?.scrollIntoView({ block: "start" }); }} /> : null}
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
