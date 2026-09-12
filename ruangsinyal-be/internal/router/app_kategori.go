package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

func AppKategoriRouter(mux *http.ServeMux, db *sql.DB) {
	repo := repository.NewAppKategoriRepository(db)
	svc := service.NewAppKategoriService(repo)
	ctrl := controller.NewAppKategoriController(svc, "/v1/app")

	mux.HandleFunc("/v1/app/kategori", ctrl.Handle)
}
