package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

func AppAdRouter(mux *http.ServeMux, db *sql.DB) {
	repo := repository.NewAppAdRepository(db)
	svc := service.NewAppAdService(repo)
	ctrl := controller.NewAppAdController(svc, "/v1/app")

	mux.HandleFunc("/v1/app/ads", ctrl.Handle)
}
