package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

func AppBrandRouter(mux *http.ServeMux, db *sql.DB) {
	repo := repository.NewAppBrandRepository(db)
	svc := service.NewAppBrandService(repo)
	ctrl := controller.NewAppBrandController(svc, "/v1/app")

	mux.HandleFunc("/v1/app/brand", ctrl.Handle)
}
