package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/gemilang"
	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/provider"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
	"ruangsinyal/yuscom"
)

func AppOrderPaymentRouter(mux *http.ServeMux, db *sql.DB, ysClient *yuscom.Client, gmClient *gemilang.Client, extraClients ...provider.Client) {
	paymentRepo := repository.NewAppOrderPaymentRepository(db)
	orderRepo := repository.NewAppOrderRepository(db)
	appProviderRepo := repository.NewAppOrderProviderTrxRepository(db)
	callbackRepo := repository.NewProviderCallbackRepository(db)
	pricingRepo := repository.NewProdukAppPricingRepository(db)
	depositRepo := repository.NewDepositRepository(db)
	bankRepo := repository.NewBankRepository(db)
	fulfillmentSvc := service.NewAppOrderFulfillmentService(orderRepo, appProviderRepo, callbackRepo, pricingRepo, ysClient, gmClient, extraClients...)
	svc := service.NewAppOrderPaymentService(paymentRepo, orderRepo, bankRepo, fulfillmentSvc)
	depositSvc := service.NewDepositService(depositRepo, bankRepo, nil)
	ctrl := controller.NewAppOrderPaymentController(svc, depositSvc)

	mux.HandleFunc("/v1/webhook/midtrans", ctrl.MidtransWebhook)
	mux.HandleFunc("/webhook/midtrans", ctrl.MidtransWebhook)
}
