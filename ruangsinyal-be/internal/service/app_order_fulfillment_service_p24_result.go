package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"ruangsinyal/internal/repository"
)

func (s *AppOrderFulfillmentService) applyPulsa24JamAppResult(ctx context.Context, data Pulsa24JamCallbackData, row *repository.AppOrderProviderTrxRow) error {
	callback := &ProviderCallbackService{
		repo: s.callbackRepo, appProviderRepo: s.providerTrxRepo,
		appOrderRepo: s.orderRepo, appPricingRepo: s.pricingRepo,
		retailRepo: repository.NewRetailRepository(s.callbackRepo.DB()),
	}
	status, result := callback.processPulsa24JamAppCallback(ctx, data, row)
	if status != 200 || result["ok"] != true {
		return fmt.Errorf("apply P24 result failed: %v", result["error"])
	}
	return nil
}

// ReconcileStoredPulsa24JamSuccess only replays verified, stored success evidence.
// It never calls PAY, changes the destination, or infers success from an estimate.
func (s *AppOrderFulfillmentService) ReconcileStoredPulsa24JamSuccess(ctx context.Context, invoice string, apply bool) error {
	order, err := s.orderRepo.GetByInvoiceID(ctx, invoice)
	if err != nil {
		return err
	}
	if order.Status == "success" {
		return nil
	}
	if order.Status != "paid" && order.Status != "processing_provider" {
		return fmt.Errorf("order is not awaiting provider completion")
	}
	row, err := s.providerTrxRepo.GetLatestByAppOrderID(ctx, order.ID)
	if err != nil {
		return err
	}
	if !strings.EqualFold(row.Provider, "Pulsa24Jam") || row.RawCallback == nil {
		return fmt.Errorf("stored P24 response is missing")
	}
	var envelope struct {
		HTTPStatus int    `json:"http_status"`
		Body       string `json:"body"`
	}
	if err := json.Unmarshal([]byte(*row.RawCallback), &envelope); err != nil {
		return err
	}
	if envelope.HTTPStatus != 200 {
		return fmt.Errorf("stored response is not HTTP 200")
	}
	data := parsePulsa24JamCallback(envelope.Body, nil, nil)
	if data.refid != row.RefID || data.refid == "" || Pulsa24JamFinalStatus(data) != "success" {
		return fmt.Errorf("stored response does not prove success for this reference")
	}
	if !apply {
		return nil
	}
	return s.applyPulsa24JamAppResult(ctx, data, row)
}
