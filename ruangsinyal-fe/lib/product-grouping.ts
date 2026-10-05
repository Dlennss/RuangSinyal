import type { UserProductItem } from "@/components/user/types";

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function getProductGroupLabel(item: Pick<UserProductItem, "group_name">, fallback = "Lainnya") {
  const fromGroup = normalizeSpaces(String(item.group_name || ""));
  return fromGroup || fallback;
}

// Display categories only: never rewrite the supplier's name, SKU, or group.
export function getProductDisplayCategory(item: Pick<UserProductItem, "nama" | "kategori_nama" | "group_name">) {
  const name = normalizeSpaces(item.nama).toUpperCase();
  const category = normalizeSpaces(item.kategori_nama).toUpperCase();
  if (/TELEPON|SMS/.test(category)) return /SMS/.test(name) ? "Paket SMS" : "Paket Telepon";
  if (category === "PULSA") {
    if (/\b(?:TRANSFER|TRAMSFER)\b/.test(name)) return "Pulsa Transfer";
    if (/\bPROMO\b/.test(name)) return "Pulsa Promo";
    if (/\bFULL SPEED\b/.test(name)) return "Full Speed";
    if (/\bH2H\b/.test(name)) return "Pulsa H2H";
    if (/\bNGRS\b/.test(name)) return "NGRS";
    if (/\bMOCHAN\b/.test(name)) return "Mochan";
    if (/\bVIP\b/.test(name)) return "Pulsa VIP";
    return "Pulsa Reguler";
  }
  if (category !== "PAKET DATA") return getProductGroupLabel(item);
  if (/\bACT SP\b|\bAKTIVASI\b/.test(name)) return "Aktivasi Perdana";
  const families: [RegExp, string][] = [
    [/\bINTERNET\s*MAX\b/, "InternetMax"], [/\bUNLIMAX\b/, "UnliMax"],
    [/\bORBIT\b/, "Orbit"], [/\bROAMAX\b|\bROAMING\b/, "Roaming"],
    [/\bSUPER SERU\b/, "Super Seru"], [/\bROLLOVER\b/, "Rollover"],
    [/\bOMG\b/, "OMG"], [/\bMAXSTREAM\b/, "MaxStream"],
    [/ILMUPEDIA|KUOTA BELAJAR|RUANGGURU/, "Pendidikan"],
    [/\bFREEDOM COMBO\b/, "Freedom Combo"], [/\bFREEDOM SACHET\b/, "Freedom Sachet"],
    [/\bFREEDOM U\b/, "Freedom U"], [/\bF?REEDOM INTERNET\b/, "Freedom Internet"],
    [/\bHIFI AIR\b/, "HiFi Air"], [/\bBRONET\b/, "Bronet"],
    [/\bFLEX MINI\b/, "Flex Mini"], [/\bFLEXMAX\b/, "FlexMax"],
    [/\b(?:XC|COMBO) FLEX\b/, "Combo Flex"], [/\bAON\b/, "AlwaysOn"],
    [/\b(?:DATA CUAN|CUANKU)\b/, "Data Cuan"], [/\bPURE\b/, "Pure Kuota"],
    [/\bMALAM\b/, "Kuota Malam"], [/\bPLANKUOTA\b/, "Plan Kuota"],
    [/\b(?:UNLIMITED|UNLI)\b/, "Unlimited"], [/\bFLASH\b/, "Flash"],
    [/\bJAJAN\b/, "Jajan"], [/\bKAGET\b/, "Kaget"],
    [/\bMASA AKTIF\b/, "Masa Aktif"], [/\bHOTPROMO\b|\bHOT PROMO\b/, "Hot Promo"],
  ];
  const family = families.find(([pattern]) => pattern.test(name))?.[1];
  if (family) return /KHUSUS NOMOR PROMO/.test(name) ? `${family} Promo` : family;
  if (/\bPAKET MINGGUAN\b/.test(name)) return "Paket Mingguan";
  if (/\bHARIAN\b/.test(name)) return "Paket Harian";
  if (/\bBULANAN\b/.test(name)) return "Paket Bulanan";
  const days = name.match(/\b(\d+)\s*(?:HARI|HR)\b/);
  if (days) {
    const duration = Number(days[1]);
    if (duration <= 7) return "Paket 1-7 Hari";
    if (duration <= 14) return "Paket 8-14 Hari";
    return "Paket 15 Hari ke Atas";
  }
  return "Paket Lainnya";
}

export function groupCatalogProducts(items: UserProductItem[]) {
  const groups = new Map<string, UserProductItem[]>();
  for (const item of items) {
    const label = getProductDisplayCategory(item);
    const group = groups.get(label) || [];
    group.push(item);
    groups.set(label, group);
  }
  return Array.from(groups, ([label, items]) => ({ label, items }))
    .sort((a, b) => a.label.localeCompare(b.label, "id-ID"));
}

export function getCatalogPage<T>(items: T[], requestedPage: number) {
  const size = 12;
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.max(1, Math.min(totalPages, Math.floor(requestedPage) || 1));
  const start = (page - 1) * size;
  return { items: items.slice(start, start + size), page, totalPages, total: items.length, start: items.length ? start + 1 : 0, end: Math.min(start + size, items.length) };
}
