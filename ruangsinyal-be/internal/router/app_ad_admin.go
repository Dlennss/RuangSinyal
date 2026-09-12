package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

func AppAdAdminRouter(mux *http.ServeMux, wrap Middleware, requireAdmin Middleware, db *sql.DB) {
	repo := repository.NewAppAdRepository(db)
	svc := service.NewAppAdService(repo)
	ctrl := controller.NewAppAdAdminController(svc, "/v1/admin")

	mux.HandleFunc("/v1/admin/app-ads", wrap(requireAdmin(ctrl.Handle)))
	mux.HandleFunc("/v1/admin/app-ads/", wrap(requireAdmin(ctrl.Handle)))
}
