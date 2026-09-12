package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/helper"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

func BankRouter(mux *http.ServeMux, wrap Middleware, db *sql.DB) {
	repo := repository.NewBankRepository(db)
	svc := service.NewBankService(repo)
	ctrl := controller.NewBankController(svc)

	readOrWallet := helper.RequireRoles("admin", "auditor", "operator_wallet", "operator_trx")
	adminOrWallet := helper.RequireRoles("admin", "auditor", "operator_wallet")
	walletTransfer := helper.RequireRoles("admin", "operator_wallet")
	walletMutation := helper.RequireRoles("admin", "operator_wallet")
	adminOnly := helper.RequireRoles("admin")
	mux.HandleFunc("/v1/admin/banks", wrap(readOrWallet(ctrl.Handle)))
	mux.HandleFunc("/v1/admin/banks/", wrap(readOrWallet(ctrl.Handle)))
	mux.HandleFunc("/v1/admin/banks/toggle-active", wrap(readOrWallet(ctrl.ToggleActive)))
	mux.HandleFunc("/v1/admin/banks/adjust", wrap(adminOnly(ctrl.AdminAdjustSaldo)))
	mux.HandleFunc("/v1/admin/banks/manual-mutasi", wrap(walletMutation(ctrl.ManualIncomingMutation)))
	mux.HandleFunc("/v1/admin/banks/provider-credit-from-mutasi", wrap(walletMutation(ctrl.CreditProviderFromBankMutation)))
	mux.HandleFunc("/v1/admin/banks/transfer", wrap(adminOnly(ctrl.AdminTransferOut)))
	mux.HandleFunc("/v1/admin/banks/transfer/bca-operasional", wrap(walletTransfer(ctrl.TransferToBCAOperational)))
	mux.HandleFunc("/v1/admin/banks/history", wrap(adminOrWallet(ctrl.AdminHistory)))
	mux.HandleFunc("/v1/admin/banks/unpaired-debits", wrap(adminOrWallet(ctrl.UnpairedDebitMutasi)))
	mux.HandleFunc("/v1/kantor24/banks/latest-mutasi", helper.RequireKantor24APIKey(ctrl.Kantor24LatestMutation))
	mux.HandleFunc("/v1/kantor24/banks/mutasi", helper.RequireKantor24APIKey(ctrl.Kantor24IncomingMutation))
}
