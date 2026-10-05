export function catalogServiceKind(categoryName: string) {
  const name = categoryName.trim().toLowerCase();
  if (name === "pulsa") return "pulsa";
  if (name === "paket data" || name === "voucher data") return "data";
  if (name === "e-wallet" || name === "e-money") return "wallet";
  if (name === "bpjs") return "bpjs";
  if (["asuransi", "multifinance", "pascabayar", "pembayaran", "pajak daerah", "samsat", "tagihan air", "tagihan gas", "internet & telco", "hp pascabayar", "internet pascabayar", "pdam", "gas negara"].includes(name)) return "billing";
  return "products";
}

export function catalogBillingPlaceholder(categoryName: string) {
  const name = categoryName.trim().toLowerCase();
  if (["pln", "listrik"].includes(name)) return "Masukkan ID pelanggan / nomor meter";
  if (["tagihan air", "pdam"].includes(name)) return "Masukkan nomor pelanggan PDAM";
  if (["pascabayar", "hp pascabayar"].includes(name)) return "Masukkan nomor pelanggan pascabayar";
  if (["tagihan gas", "gas negara"].includes(name)) return "Masukkan ID pelanggan gas";
  return "Masukkan ID pelanggan";
}
