import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// This export is a reference, never a replacement for a live authenticated catalog.
export function parseP24Catalog(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const countAt = lines.indexOf("Total Produk Aktif");
  const expectedCount = Number(lines[countAt + 1]);
  const start = lines.indexOf("Semua brand") + 1;
  if (countAt < 0 || start === 0 || !Number.isSafeInteger(expectedCount) || expectedCount <= 0) {
    throw new Error("Header katalog H2HR tidak valid");
  }
  let category = "";
  let brand = "";
  const products = [];
  const seen = new Set();
  for (let i = start; i < lines.length;) {
    const header = lines[i + 1] === "SKU" ? i + 1 : lines[i + 2] === "SKU" ? i + 2 : -1;
    if (header >= 0 && lines[header + 1] === "Keterangan" && lines[header + 2] === "Harga") {
      if (header === i + 2) category = lines[i];
      brand = lines[header - 1];
      i = header + 3;
      continue;
    }
    const [sku, name, group, typeText, priceText] = lines.slice(i, i + 5);
    const typeMatch = /^(FIXED|OPEN_AMOUNT)(?:\s+\u2022 Maks ([\d.]+))?$/.exec(typeText || "");
    const type = typeMatch?.[1];
    const price = /^(?:\+\s*)?Rp\s+([\d.]+)$/.exec(priceText || "");
    if (!category || !brand || !price || !["FIXED", "OPEN_AMOUNT"].includes(type)) {
      throw new Error(`Baris produk tidak valid: ${i + 1} (${sku})`);
    }
    if (seen.has(sku.toUpperCase())) throw new Error(`SKU duplikat: ${sku}`);
    seen.add(sku.toUpperCase());
    products.push({ sku, name, group, category, brand, type, price: Number(price[1].replaceAll(".", "")), maximumNominal: typeMatch[2] ? Number(typeMatch[2].replaceAll(".", "")) : null });
    i += 5;
  }
  if (products.length !== expectedCount) {
    throw new Error(`Katalog tidak lengkap: ${products.length}/${expectedCount}`);
  }
  return products;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const products = parseP24Catalog(await readFile(process.argv[2], "utf8"));
  const categories = [...new Set(products.map((p) => p.category))].sort();
  const brands = [...new Set(products.map((p) => p.brand))].sort();
  console.log(JSON.stringify({ count: products.length, fixed: products.filter((p) => p.type === "FIXED").length, categories, brands }, null, 2));
}
