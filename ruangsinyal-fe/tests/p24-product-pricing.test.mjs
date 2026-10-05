import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../components/guest/product-card-shared.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { getDisplayedOpenAmountFee, getDisplayProductName, getProductPricing } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

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
