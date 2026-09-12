package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/helper"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

func RetailAdminRouter(mux *http.ServeMux, wrap Middleware, db *sql.DB) {
	repo := repository.NewRetailRepository(db)
	bankRepo := repository.NewBankRepository(db)
	svc := service.NewRetailService(repo, bankRepo)
	ctrl := controller.NewRetailAdminController(svc)

	adminOrWallet := helper.RequireRoles("admin", "operator_wallet", "analis")
	mux.HandleFunc("/v1/admin/retail/withdraw-requests", wrap(adminOrWallet(ctrl.ListWithdrawRequests)))
	mux.HandleFunc("/v1/admin/retail/withdraw-requests/banks", wrap(adminOrWallet(ctrl.ListWithdrawSourceBanks)))
	mux.HandleFunc("/v1/admin/retail/withdraw-requests/approve", wrap(adminOrWallet(ctrl.ApproveWithdrawRequest)))
	mux.HandleFunc("/v1/admin/retail/withdraw-requests/reject", wrap(adminOrWallet(ctrl.RejectWithdrawRequest)))
}
