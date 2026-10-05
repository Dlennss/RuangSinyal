package service

import (
	"errors"
	"fmt"
	"math"
	"strings"

	"ruangsinyal/internal/provider"
)

var ErrAppOrderPriceChanged = errors.New("Harga atau konfigurasi produk berubah. Muat ulang produk dan periksa total terbaru sebelum membayar. Order belum dibuat dan saldo belum dipotong.")

func liveAppProductPrice(sku, priceType string, qty int64, product *provider.Pulsa24JamProduct) (int64, error) {
	if product == nil || !product.Active || !strings.EqualFold(strings.TrimSpace(sku), strings.TrimSpace(product.SKU)) ||
		!strings.EqualFold(strings.TrimSpace(priceType), strings.TrimSpace(product.PriceType)) {
		return 0, ErrAppOrderPriceChanged
	}
	if strings.EqualFold(priceType, "OPEN_AMOUNT") && product.MaximumNominal != nil && *product.MaximumNominal > 0 && qty > *product.MaximumNominal {
		return 0, fmt.Errorf("nominal melebihi batas terbaru P24 (%d)", *product.MaximumNominal)
	}
	for _, price := range []*int64{product.AppBasePrice, product.Price, product.AdditionalFee} {
		if price != nil {
			if *price < 0 {
				return 0, ErrAppOrderPriceChanged
			}
			return *price, nil
		}
	}
	return 0, ErrAppOrderPriceChanged
}

func addAppPrices(a, b int64) (int64, error) {
	if a < 0 || b < 0 || a > math.MaxInt64-b {
		return 0, fmt.Errorf("harga atau nominal tidak valid")
	}
	return a + b, nil
}

func appOrderPaymentFee(buyerType string, subtotal int64) int64 {
	// Account checkout only debits balance; QRIS fees belong to guest payments.
	if buyerType != "guest" {
		return 0
	}
	return computeAppOrderPaymentFee(subtotal)
}
