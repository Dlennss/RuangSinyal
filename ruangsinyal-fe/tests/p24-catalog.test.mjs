import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { parseP24Catalog } from "../scripts/inspect-p24-catalog.mjs";
import { catalogServiceKind } from "../lib/catalog-service.ts";
import { getGuestCategoryPath } from "../lib/category-routes.ts";
import { getBrandLogo } from "../lib/brand-logos.ts";

const snapshot = `Total Produk Aktif
2
Semua brand
E-Wallet
DANA
SKU
Keterangan
Harga
UDDND10
Dana 10.000
PULSA
FIXED
Rp 11.055
DANA
Dana Bebas Nominal
BEBAS NOMINAL
OPEN_AMOUNT \u2022 Maks 1.000.000
+ Rp 1.000`;

test("H2HR snapshot preserves SKUs, category, brand, fees and amount limits", () => {
  const items = parseP24Catalog(snapshot);
  assert.deepEqual(items[0], { sku: "UDDND10", name: "Dana 10.000", group: "PULSA", category: "E-Wallet", brand: "DANA", type: "FIXED", price: 11055, maximumNominal: null });
  assert.equal(items[1].price, 1000);
  assert.equal(items[1].maximumNominal, 1000000);
});

test("incomplete, duplicate and invalid snapshot rows are rejected", () => {
  assert.throws(() => parseP24Catalog(snapshot.replace("Aktif\n2", "Aktif\n3")), /tidak lengkap/);
  assert.throws(() => parseP24Catalog(snapshot.replace("\nDANA\nDana Bebas", "\nUDDND10\nDana Bebas")), /duplikat/);
  assert.throws(() => parseP24Catalog(snapshot.replace("FIXED", "UNKNOWN")), /tidak valid/);
});

test("service routing uses upstream names, never legacy category IDs", () => {
  assert.equal(getGuestCategoryPath({ id: 1, nama: "Asuransi" }), "/kategori/1?name=Asuransi");
  assert.equal(getGuestCategoryPath({ id: 99, nama: "Pulsa" }), "/kategori/99?name=Pulsa");
  assert.equal(catalogServiceKind("E-Wallet"), "wallet");
  assert.equal(catalogServiceKind("E-Money"), "wallet");
  assert.equal(catalogServiceKind("Pulsa"), "pulsa");
  assert.equal(catalogServiceKind("Paket Data"), "data");
  assert.equal(catalogServiceKind("Tagihan Air"), "billing");
  assert.equal(catalogServiceKind("Asuransi"), "billing");
  assert.equal(catalogServiceKind("Bank Transfer"), "products");
});

test("known P24 brand spellings resolve to existing assets without made-up logos", () => {
  for (const brand of ["Mandiri", "BCA", "BPJS Kesehatan", "BPJS Ketenagakerjaan", "PLN", "PGN", "MyRepublic", "MAGIC CHESS : GO GO", "by.U", "i.Saku", "POINT BLANK - CASH"]) {
    const logo = getBrandLogo(brand);
    assert.ok(logo, brand);
    assert.ok(existsSync(new URL(`../public${logo.src}`, import.meta.url)), `${brand}: ${logo.src}`);
    assert.ok(!logo.src.includes("generated"));
  }
  assert.equal(getBrandLogo("Unknown Provider"), null);
  assert.equal(getBrandLogo("BLOOD STRIKE"), null);
});
