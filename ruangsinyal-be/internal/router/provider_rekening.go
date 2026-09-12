package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/helper"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

func ProviderRekeningRouter(mux *http.ServeMux, wrap Middleware, db *sql.DB) {
	repo := repository.NewProviderRekeningRepository(db)
	svc := service.NewProviderRekeningService(repo)
	ctrl := controller.NewProviderRekeningController(svc)
	roles := helper.RequireRoles("admin", "operator_wallet")

	mux.HandleFunc("/v1/admin/provider-accounts", wrap(roles(ctrl.Handle)))
	mux.HandleFunc("/v1/admin/provider-accounts/", wrap(roles(ctrl.Handle)))
}
