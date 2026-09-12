package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

func ProviderRouter(mux *http.ServeMux, wrap Middleware, requireAdmin Middleware, db *sql.DB) {
	repo := repository.NewProviderRepository(db)
	svc := service.NewProviderService(repo)
	ctrl := controller.NewProviderController(svc, "/v1/admin")

	mux.HandleFunc("/v1/admin/provider", wrap(requireAdmin(ctrl.Handle)))
	mux.HandleFunc("/v1/admin/provider/", wrap(requireAdmin(ctrl.Handle)))
}
