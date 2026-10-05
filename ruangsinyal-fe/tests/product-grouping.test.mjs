import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/product-grouping.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { getProductDisplayCategory, groupCatalogProducts, getCatalogPage } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("pulsa categories distinguish transfer, regular, promo and full speed", () => {
  for (const [nama, expected] of [
    ["INDOSAT TRANSFER PULSA 500", "Pulsa Transfer"],
    ["INDOSAT TRAMSFER PULSA 5.000", "Pulsa Transfer"],
    ["INDOSAT PULSA REGULER 5.000", "Pulsa Reguler"],
    ["INDOSAT REGULAR PROMO 10.000", "Pulsa Promo"],
    ["PULSA THREE FULL SPEED 5.000", "Full Speed"],
    ["TELKOMSEL NGRS 10.000", "NGRS"],
    ["INDOSAT PULSA H2H 10.000", "Pulsa H2H"],
  ]) assert.equal(getProductDisplayCategory({ nama, kategori_nama: "Pulsa", group_name: "PULSA" }), expected);
});

test("data families retain promo distinctions and separate SIM activation", () => {
  for (const [nama, expected] of [
    ["[KHUSUS NOMOR PROMO] INTERNETMAX 7GB 30HARI", "InternetMax Promo"],
    ["ACT SP INTERNETMAX 3GB 30HR", "Aktivasi Perdana"],
    ["TELKOMSEL ORBIT DEALS 100GB 30 HARI", "Orbit"],
    ["[KHUSUS NOMOR PROMO] UNLIMAX 7GB 30HARI", "UnliMax Promo"],
    ["FREEDOM INTERNET 10GB 30HARI", "Freedom Internet"],
    ["FREEDOM COMBO 10GB 30HARI", "Freedom Combo"],
    ["XL FLEX MINI 12GB, 2 HARI", "Flex Mini"],
    ["40GB|52GB AON 365HR", "AlwaysOn"],
    ["AIGO BRONET 10GB 28HR", "Bronet"],
    ["[HARIAN] 9GB KUOTA MALAM 7 HARI", "Kuota Malam"],
    ["[3HARI] AXIS 12,5GB + LOKAL", "Paket 1-7 Hari"],
    ["PAKET MINGGUAN 1.5 GB", "Paket Mingguan"],
    ["PRODUK PO", "Paket Lainnya"],
  ]) assert.equal(getProductDisplayCategory({ nama, kategori_nama: "Paket Data", group_name: "PPOB" }), expected);
});

test("display grouping preserves every product and supplier metadata", () => {
  const products = [
    { id: 1, sku: "TIM1", nama: "[KHUSUS NOMOR PROMO] INTERNETMAX 3GB 30HARI", kategori_nama: "Paket Data", group_name: "PULSA", harga_dasar_app: 19683 },
    { id: 2, sku: "TO10Z", nama: "TELKOMSEL ORBIT 10GB 7 HARI", kategori_nama: "Paket Data", group_name: "PULSA", harga_dasar_app: 36909 },
    { id: 3, sku: "TIM2", nama: "[KHUSUS NOMOR PROMO] INTERNETMAX 7GB 30HARI", kategori_nama: "Paket Data", group_name: "PULSA", harga_dasar_app: 31411 },
  ];
  const before = structuredClone(products);
  const groups = groupCatalogProducts(products);
  assert.deepEqual(groups.map(g => [g.label, g.items.length]), [["InternetMax Promo", 2], ["Orbit", 1]]);
  assert.deepEqual(groups.flatMap(g => g.items).sort((a, b) => a.id - b.id), before);
  assert.deepEqual(products, before);
});

test("pagination never drops or duplicates products and clamps invalid pages", () => {
  const products = Array.from({ length: 29 }, (_, id) => ({ id }));
  assert.equal(getCatalogPage(products, 1).items.length, 12);
  assert.equal(getCatalogPage(products, 2).start, 13);
  assert.equal(getCatalogPage(products, 3).items.length, 5);
  assert.equal(getCatalogPage(products, 999).page, 3);
  assert.equal(getCatalogPage(products, -1).page, 1);
  assert.deepEqual([1, 2, 3].flatMap(page => getCatalogPage(products, page).items), products);
  assert.deepEqual(getCatalogPage([], 9), { items: [], page: 1, totalPages: 1, total: 0, start: 0, end: 0 });
  assert.equal(getCatalogPage(products.slice(0, 2), 3).page, 1);
});

test("unrelated service groups are preserved", () => {
  assert.equal(getProductDisplayCategory({ nama: "PLN 20.000", kategori_nama: "PLN", group_name: "PPOB" }), "PPOB");
});
