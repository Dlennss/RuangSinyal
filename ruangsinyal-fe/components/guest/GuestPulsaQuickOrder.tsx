"use client";

import * as React from "react";
import { LoaderCircle, Search } from "lucide-react";
import type { UserBrandItem, UserProductItem } from "@/components/user/types";
import { UserCheckoutModal } from "@/components/user/UserCheckoutModal";
import { QuickProductOptionGrid } from "@/components/guest/QuickProductOptionGrid";
import { ProviderBrandPicker } from "@/components/guest/ProviderBrandPicker";
import { PulsaEntryCard } from "@/components/guest/PulsaEntryCard";
import { getDedicatedGuestBrandPath } from "@/lib/dedicated-category-brand-routes";
import { findDetectedOperatorBrand, normalizeOperatorDigits } from "@/lib/operator-brand-detection";
import { filterAndSortFixedProducts, getDisplayedFixedPrice } from "@/components/guest/product-card-shared";
import { getCatalogPage, groupCatalogProducts } from "@/lib/product-grouping";
import { ProductCategoryTabs, ProductPagination } from "@/components/guest/ProductCatalogNavigation";

type GuestPulsaQuickOrderProps = {
  kategoriId: string;
  brands: UserBrandItem[];
  authToken?: string;
  buyerRole?: string;
  forcedBrand?: UserBrandItem;
  relatedKategoriIds?: string[];
};

const BRAND_FAMILY_ALIASES: Record<string, string[]> = {
  xl: ["xl", "axis"],
  axis: ["axis", "xl"],
};

function formatNominal(value: number) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

function extractPulsaNominalValue(item: UserProductItem) {
  const upper = item.nama.toUpperCase();
  const dotted = upper.match(/(\d{1,3}(?:\.\d{3})+)/);
  if (dotted) {
    const parsed = Number.parseInt(dotted[1].replace(/\./g, ""), 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const compact = upper.match(/(\d+)\s*K\b/);
  if (compact) {
    const parsed = Number.parseInt(compact[1], 10);
    if (!Number.isNaN(parsed)) return parsed * 1000;
  }

  const plain = upper.match(/\b(\d+)\s*$/);
  if (plain) return Number(plain[1]);

  return Number(item.nominal || 0);
}

async function getClientProductsByBrand(kategoriIds: string[], brandId: string): Promise<UserProductItem[]> {
  const rows = await Promise.all(
    kategoriIds.map(async (kategoriId) => {
      const res = await fetch(
        `/api/app/produk?kategori_id=${encodeURIComponent(kategoriId)}&brand_id=${encodeURIComponent(brandId)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Gagal mengambil produk pulsa (${res.status})`);
      }

      const json = (await res.json().catch(() => ({}))) as { items?: UserProductItem[] };
      return Array.isArray(json.items) ? json.items : [];
    })
  );

  const merged = new Map<number, UserProductItem>();
  for (const items of rows) {
    for (const item of items) {
      merged.set(item.id, item);
    }
  }

  return Array.from(merged.values());
}

function resolveBrandFamilyIds(selectedBrand: UserBrandItem, brands: UserBrandItem[]) {
  const normalized = selectedBrand.nama.trim().toLowerCase();
  const aliases = BRAND_FAMILY_ALIASES[normalized];
  if (!aliases) return [String(selectedBrand.id)];

  const ids = brands
    .filter((brand) => aliases.includes(brand.nama.trim().toLowerCase()))
    .map((brand) => String(brand.id));

  return ids.length ? Array.from(new Set(ids)) : [String(selectedBrand.id)];
}

export function GuestPulsaQuickOrder({ kategoriId, brands, authToken, buyerRole, forcedBrand, relatedKategoriIds }: GuestPulsaQuickOrderProps) {
  const [phone, setPhone] = React.useState("");
  const [nominalInput, setNominalInput] = React.useState("");
  const [products, setProducts] = React.useState<UserProductItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<UserProductItem | null>(null);
  const [selectedVariant, setSelectedVariant] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const catalogRef = React.useRef<HTMLDivElement>(null);
  const cacheRef = React.useRef<Record<string, UserProductItem[]>>({});
  const sourceKategoriIds = React.useMemo(() => {
    const values = [kategoriId, ...(relatedKategoriIds || [])].map((value) => String(value).trim()).filter(Boolean);
    return Array.from(new Set(values));
  }, [kategoriId, relatedKategoriIds]);
  const allowedKategoriIds = React.useMemo(() => new Set(sourceKategoriIds.map((value) => Number(value))), [sourceKategoriIds]);

  const detectedBrand = React.useMemo(() => {
    if (forcedBrand) return forcedBrand;
    return findDetectedOperatorBrand(phone, brands);
  }, [forcedBrand, phone, brands]);
  const normalizedPhone = React.useMemo(() => normalizeOperatorDigits(phone), [phone]);
  const nominalValue = Number.parseInt(nominalInput.replace(/\D/g, ""), 10) || 0;
  const brandFamilyIds = React.useMemo(() => {
    if (!detectedBrand) return [];
    return resolveBrandFamilyIds(detectedBrand, brands);
  }, [detectedBrand, brands]);
  const cacheKey = React.useMemo(() => `${sourceKategoriIds.join(",")}:${brandFamilyIds.slice().sort().join(",")}`, [brandFamilyIds, sourceKategoriIds]);

  React.useEffect(() => {
    setSelectedVariant("");
    setSearch("");
    if (!detectedBrand?.id || !brandFamilyIds.length) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const cached = cacheRef.current[cacheKey];
    if (cached) {
      setProducts(cached);
      setLoading(false);
      return;
    }

    let active = true;
    setProducts([]);
    setLoading(true);
    void Promise.all(brandFamilyIds.map((brandId) => getClientProductsByBrand(sourceKategoriIds, brandId)))
      .then((brandRows) => {
        if (!active) return;
        const merged = new Map<number, UserProductItem>();
        for (const rows of brandRows) {
          for (const item of rows) {
            merged.set(item.id, item);
          }
        }
        const sorted = Array.from(merged.values())
          .filter((item) => item.aktif !== false && item.tipe_harga === "FIXED" && allowedKategoriIds.has(Number(item.kategori_id)))
          .sort((a, b) => Number(a.nominal || 0) - Number(b.nominal || 0));
        cacheRef.current[cacheKey] = sorted;
        setProducts(sorted);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [allowedKategoriIds, brandFamilyIds, cacheKey, detectedBrand?.id, sourceKategoriIds]);

  const variantGroups = React.useMemo(() => groupCatalogProducts(products), [products]);

  React.useEffect(() => {
    if (!variantGroups.length) {
      setSelectedVariant("");
      return;
    }

    setSelectedVariant((current) => {
      if (current && variantGroups.some((group) => group.label === current)) return current;
      return "";
    });
  }, [variantGroups]);

  const activeProducts = React.useMemo(() => {
    const items = variantGroups.find((group) => group.label === selectedVariant)?.items || products;
    return filterAndSortFixedProducts(items, search, "price-asc", buyerRole || (authToken ? "user" : "guest"));
  }, [products, selectedVariant, variantGroups, search, buyerRole, authToken]);

  const matchedProduct = React.useMemo(() => {
    if (!nominalValue) return null;
    const matches = activeProducts.filter((item) => extractPulsaNominalValue(item) === nominalValue);
    return matches.length === 1 ? matches[0] : null;
  }, [nominalValue, activeProducts]);

  const visibleProducts = React.useMemo(() => {
    return nominalValue ? activeProducts.filter((item) => extractPulsaNominalValue(item) === nominalValue) : activeProducts;
  }, [activeProducts, nominalValue]);
  React.useEffect(() => { setPage(1); }, [visibleProducts]);
  const pagination = getCatalogPage(visibleProducts, page);

  return (
    <>
      <div className="space-y-4">
        <PulsaEntryCard
          phone={phone}
          nominalInput={nominalInput}
          onPhoneChange={setPhone}
          onNominalChange={setNominalInput}
          onQuickBuy={() => {
            if (matchedProduct && normalizedPhone.length >= 8 && normalizedPhone.length <= 13) {
              setSelectedProduct(matchedProduct);
            }
          }}
          buyDisabled={!matchedProduct || normalizedPhone.length < 8 || normalizedPhone.length > 13}
          detectedBrand={detectedBrand}
          matchedProduct={matchedProduct}
          normalizedPhone={normalizedPhone}
          nominalValue={nominalValue}
          formatNominal={formatNominal}
          getDisplayedFixedPrice={(item) => getDisplayedFixedPrice(item, buyerRole || (authToken ? "user" : "guest"))}
        />

        <section className="">
          <div className="space-y-4">
            {!detectedBrand && !forcedBrand ? (
            <div className="space-y-3">
              <ProviderBrandPicker
                items={brands.map((brand) => ({
                  brand,
                  href: getDedicatedGuestBrandPath(kategoriId, brand) || `/kategori/${kategoriId}/brand/${brand.id}?name=${encodeURIComponent(brand.nama)}`,
                }))}
              />
            </div>
          ) : null}

          {detectedBrand ? (
            <div ref={catalogRef} className="scroll-mt-20">
              <div className="mb-2 flex items-center justify-between gap-3">
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-[#e50b18]" /> : null}
              </div>

              {!loading && products.length > 0 ? <>
                <ProductCategoryTabs groups={variantGroups} brandName={detectedBrand.nama} value={selectedVariant} onChange={setSelectedVariant} />
                <label className="mb-3 flex min-h-11 items-center gap-2 rounded-lg border border-sky-200 bg-white px-3">
                  <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-600" />
                  <input aria-label="Cari nama atau SKU produk" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau SKU produk" className="min-w-0 w-full bg-transparent py-2 text-sm text-slate-900 outline-none" />
                </label>
              </> : null}

              {loading ? (
                <div className="grid min-h-28 place-items-center rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 text-sm font-semibold text-slate-500">
                  Memuat produk pulsa...
                </div>
              ) : visibleProducts.length > 0 ? (
                <QuickProductOptionGrid
                  items={pagination.items.map((item) => {
                    return {
                      id: item.id,
                      title: (
                        <p
                          className="w-full break-words text-left text-[13px] font-semibold leading-snug text-white"
                        >
                          {item.nama}
                        </p>
                      ),
                      subtitle: <>Rp. {formatNominal(getDisplayedFixedPrice(item, buyerRole || (authToken ? "user" : "guest")))}</>,
                    };
                  })}
                  selectedId={matchedProduct?.id}
                  onSelect={(id) => {
                    const found = visibleProducts.find((item) => item.id === id) || null;
                    setSelectedProduct(found);
                  }}
                  variant="pulsa"
                />
              ) : (
                <div className="grid min-h-28 place-items-center rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-4 text-center text-sm font-semibold text-slate-500">
                  {products.length ? "Produk tidak ditemukan." : "Belum ada produk aktif untuk operator ini."}
                </div>
              )}
              {!loading ? <ProductPagination {...pagination} onChange={(next) => { setPage(next); catalogRef.current?.scrollIntoView({ block: "start" }); }} /> : null}
            </div>
          ) : null}
          </div>
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
