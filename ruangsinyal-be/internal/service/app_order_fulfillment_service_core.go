package service

import (
	"ruangsinyal/gemilang"
	"ruangsinyal/internal/provider"
	"ruangsinyal/internal/repository"
	"ruangsinyal/yuscom"
	"strings"
)

type AppOrderFulfillmentService struct {
	orderRepo       *repository.AppOrderRepository
	providerTrxRepo *repository.AppOrderProviderTrxRepository
	callbackRepo    *repository.ProviderCallbackRepository
	pricingRepo     *repository.ProdukAppPricingRepository
	ysClient        *yuscom.Client
	gmClient        *gemilang.Client
	providerClients map[string]provider.Client
}

func NewAppOrderFulfillmentService(orderRepo *repository.AppOrderRepository, providerTrxRepo *repository.AppOrderProviderTrxRepository, callbackRepo *repository.ProviderCallbackRepository, pricingRepo *repository.ProdukAppPricingRepository, ysClient *yuscom.Client, gmClient *gemilang.Client, extraClients ...provider.Client) *AppOrderFulfillmentService {
	providerClients := map[string]provider.Client{}
	for _, client := range extraClients {
		if client != nil && client.Name() != "" {
			providerClients[strings.ToLower(strings.TrimSpace(client.Name()))] = client
		}
	}
	return &AppOrderFulfillmentService{
		orderRepo:       orderRepo,
		providerTrxRepo: providerTrxRepo,
		callbackRepo:    callbackRepo,
		pricingRepo:     pricingRepo,
		ysClient:        ysClient,
		gmClient:        gmClient,
		providerClients: providerClients,
	}
}
