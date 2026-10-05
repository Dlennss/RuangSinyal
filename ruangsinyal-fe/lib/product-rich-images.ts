import type { UserProductItem } from "@/components/user/types";
import { getBrandLogo } from "@/lib/brand-logos";
import { CANONICAL_SITE_URL, DEFAULT_OG_IMAGE_URL } from "@/lib/seo-articles";

type ProductRichImageInput = {
  brandName?: string;
  categoryName?: string;
  items?: UserProductItem[];
};

function toAbsoluteUrl(src: string) {
  if (/^https?:\/\//i.test(src)) return src;
  return `${CANONICAL_SITE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqueNames(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = String(value || "").trim();
    if (!trimmed) continue;
    const key = normalizeName(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function getRichProductImageUrl({ brandName, items = [] }: ProductRichImageInput) {
  const candidateNames = uniqueNames([
    brandName,
    ...items.map((item) => String(item.brand_nama || "").trim()),
  ]);

  for (const candidate of candidateNames) {
    const brandLogo = getBrandLogo(candidate);
    if (brandLogo?.src) {
      return toAbsoluteUrl(brandLogo.src);
    }
  }

  return DEFAULT_OG_IMAGE_URL;
}
