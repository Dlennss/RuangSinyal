package service

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"ruangsinyal/gemilang"
	"ruangsinyal/internal/helper"
	providerpkg "ruangsinyal/internal/provider"
	"ruangsinyal/internal/repository"
	"ruangsinyal/yuscom"
)

func appOrderProviderRefID(provider string, order *repository.AppOrderRow) (string, error) {
	if order == nil {
		return "", fmt.Errorf("order not found")
	}
	if !strings.EqualFold(strings.TrimSpace(provider), providerpkg.Pulsa24JamProviderName) {
		return order.InvoiceID, nil
	}
	if order.ID <= 0 {
		return "", fmt.Errorf("persisted order ID required for P24 reference")
	}
	// Namespace + base36 primary key is stable, unique per order and at most 16 characters.
	// Keep the customer invoice unchanged; callbacks resolve via app_order_provider_trx.ref_id.
	return "RSA" + strings.ToUpper(strconv.FormatInt(order.ID, 36)), nil
}

func (s *AppOrderFulfillmentService) handleFailedOrder(ctx context.Context, order *repository.AppOrderRow, providerTrxID int64, msg, reasonPrefix string) error {
	if order == nil {
		return fmt.Errorf("order not found")
	}

	reason := strings.TrimSpace(reasonPrefix)
	if reason == "" {
		reason = "transaksi provider aplikasi gagal"
	}
	if strings.TrimSpace(msg) != "" {
		reason = fmt.Sprintf("%s: %s", reason, strings.TrimSpace(msg))
	}

	if order.BuyerType == "user" && order.MemberID != nil && *order.MemberID > 0 && order.HargaFinal > 0 {
		if err := s.callbackRepo.RefundAppOrderFunding(ctx, *order.MemberID, order.InvoiceID, "refund saldo otomatis: "+reason); err != nil {
			_ = s.orderRepo.UpdateStatusByID(ctx, order.ID, "failed")
			return fmt.Errorf("refund app order gagal member_id=%d invoice=%s err=%w", *order.MemberID, order.InvoiceID, err)
		}
		if err := s.orderRepo.UpdateStatusByID(ctx, order.ID, "refunded"); err != nil {
			return err
		}
		helper.AppendProviderServiceLog("provider_wallet.log", "app order dispatch fail refunded member_id=%d invoice=%s provider_trx_id=%d", *order.MemberID, order.InvoiceID, providerTrxID)
		return nil
	}

	if strings.TrimSpace(strings.ToLower(order.BuyerType)) == "guest" && order.HargaFinal > 0 {
		if err := s.orderRepo.UpsertGuestRefundTicket(ctx, order, "refund guest pending claim: "+reason); err != nil {
			helper.AppendProviderServiceLog("provider_callback_service.log", "guest refund ticket create failed invoice=%s provider_trx_id=%d err=%v", order.InvoiceID, providerTrxID, err)
		}
	}

	return s.orderRepo.UpdateStatusByID(ctx, order.ID, "failed")
}

func appOrderProviderLooksLikeSystemIssue(provider, body string) bool {
	switch strings.TrimSpace(strings.ToLower(provider)) {
	case "gemilang":
		return gemilang.LooksLikeSystemIssue(body)
	case "pulsa24jam":
		upper := strings.ToUpper(strings.TrimSpace(body))
		return strings.Contains(upper, "TIMEOUT") || strings.Contains(upper, "SYSTEM ERROR") || strings.Contains(upper, "MAINTENANCE")
	default:
		return yuscom.LooksLikeSystemIssue(body)
	}
}

func appOrderProviderImmediateReject(provider, body string) bool {
	switch strings.TrimSpace(strings.ToLower(provider)) {
	case "gemilang":
		return helper.LooksLikeGemilangImmediateReject(body)
	case "pulsa24jam":
		upper := strings.ToUpper(strings.TrimSpace(body))
		return strings.Contains(upper, "GAGAL") ||
			strings.Contains(upper, "FAILED") ||
			strings.Contains(upper, "SALDO TIDAK CUKUP") ||
			strings.Contains(upper, `"STATUS":3`) ||
			strings.Contains(upper, `"STATUS":"3"`) ||
			strings.Contains(upper, `"STATUS":"FAILED"`) ||
			strings.Contains(upper, `"SUCCESS":FALSE`)
	default:
		return helper.LooksLikeYuscomImmediateReject(body)
	}
}

func appOrderProviderProductUnavailable(provider, body string) bool {
	if !strings.EqualFold(strings.TrimSpace(provider), providerpkg.Pulsa24JamProviderName) {
		return false
	}
	upper := strings.ToUpper(strings.TrimSpace(body))
	return strings.Contains(upper, "PRODUK KEHABISAN STOK") ||
		strings.Contains(upper, "PRODUCT OUT OF STOCK") ||
		strings.Contains(upper, "NOMINAL PRODUK TIDAK VALID")
}

func resolvePulsa24JamAppRequest(providerProductCode string, order *repository.AppOrderRow) (string, int64) {
	providerProductCode = strings.TrimSpace(providerProductCode)
	if order == nil {
		return providerProductCode, 0
	}
	qty := order.Qty
	if qty <= 0 {
		qty = 1
	}
	// H2HR routes by the exact catalog SKU; a fixed wallet SKU is not an open-amount SKU.
	return providerProductCode, qty
}

func appOrderProviderLooksLikeAccepted(provider, body string) bool {
	switch strings.TrimSpace(strings.ToLower(provider)) {
	case "gemilang":
		return helper.LooksLikeGemilangAccepted(body) || helper.LooksLikeGemilangSuccess(body)
	case "pulsa24jam":
		upper := strings.ToUpper(strings.TrimSpace(body))
		return strings.Contains(upper, "SUKSES") ||
			strings.Contains(upper, "SUCCESS") ||
			strings.Contains(upper, "PENDING") ||
			strings.Contains(upper, `"OK":TRUE`) ||
			strings.Contains(upper, `"SUCCESS":TRUE`) ||
			strings.Contains(upper, `"RC":"00"`)
	default:
		return helper.LooksLikeYuscomAccepted(body) || strings.Contains(strings.ToUpper(strings.TrimSpace(body)), "SUKSES")
	}
}
