import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../components/guest/product-card-shared.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { getDisplayedOpenAmountFee, getDisplayedFixedPrice, getDisplayProductName, getProductPricing, filterAndSortFixedProducts } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

test("open amount shows P24 fee plus the applicable retail fee", () => {
  const item = { tipe_harga: "OPEN_AMOUNT", harga_dasar_app: 1500, fee_guest: 100, fee_user: 50 };
  assert.equal(getDisplayedOpenAmountFee(item, 100), 1600);
  assert.equal(getProductPricing(item, false).openAmountPrice, 1600);
  assert.equal(getProductPricing(item, true).openAmountPrice, 1550);
  assert.equal(getDisplayedOpenAmountFee({ harga_dasar_app: 0 }, 0), 0);
});

test("product descriptions stay identical to the H2HR catalog", () => {
  for (const [nama, brand_nama, kategori_nama] of [
    ["Telkomsel Data 10GB 30 Hari", "Telkomsel", "Paket Data"],
    ["Mobile Legend 10 Diamond", "Mobile Legend", "Game"],
    ["Token Listrik 20.000", "PLN", "PLN"],
  ]) assert.equal(getDisplayProductName({ nama, brand_nama, kategori_nama }), nama);
});

const catalog = [
  { sku: "TM1", nama: "PAKET MINGGUAN 1.5 GB", group_name: "PPOB", tipe_harga: "FIXED", harga_dasar_app: 1000, fee_guest: 0, fee_user: 100 },
  { sku: "TO100Z", nama: "TELKOMSEL ORBIT DEALS 100GB 30 HARI", group_name: "PULSA", tipe_harga: "FIXED", harga_dasar_app: 198844, fee_guest: 200, fee_user: 50 },
  { sku: "TO10Z", nama: "TELKOMSEL ORBIT 10GB 7 HARI", group_name: "PULSA", tipe_harga: "FIXED", harga_dasar_app: 36909, fee_guest: 500, fee_user: 0 },
];

test("unfiltered catalog retains every group and each SKU's own price", () => {
  const before = structuredClone(catalog);
  const all = filterAndSortFixedProducts(catalog, "", "name", "guest");
  assert.equal(all.length, 3);
  assert.deepEqual(new Set(all.map((item) => item.group_name)), new Set(["PPOB", "PULSA"]));
  assert.deepEqual(all.map((item) => item.sku), ["TM1", "TO10Z", "TO100Z"]);
  assert.deepEqual(all.map((item) => getDisplayedFixedPrice(item, "guest")), [1000, 37409, 199044]);
  assert.deepEqual(catalog, before);
});

test("search matches exact SKU or product name case-insensitively", () => {
  assert.deepEqual(filterAndSortFixedProducts(catalog, " to100z ", "name").map((item) => item.sku), ["TO100Z"]);
  assert.equal(filterAndSortFixedProducts(catalog, "orbit", "name").length, 2);
  assert.equal(filterAndSortFixedProducts(catalog, "unknown", "name").length, 0);
  assert.equal(filterAndSortFixedProducts([], "", "name").length, 0);
});

test("price sorting uses role-specific final prices, not nominal or group order", () => {
  const items = [
    { ...catalog[0], harga_agent_final: 40000 },
    { ...catalog[2], harga_agent_final: 37500 },
  ];
  assert.deepEqual(filterAndSortFixedProducts(items, "", "price-asc", "agent").map((item) => item.sku), ["TO10Z", "TM1"]);
  assert.deepEqual(filterAndSortFixedProducts(items, "", "price-desc", "agent").map((item) => item.sku), ["TM1", "TO10Z"]);
  assert.equal(getDisplayedFixedPrice(catalog[0], "user"), 1100);
  assert.equal(getProductPricing(catalog[0], false).isFixed, true);
  assert.equal(getProductPricing(catalog[0], false).fixedPrice, 1000);
});
