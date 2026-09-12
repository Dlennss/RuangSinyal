package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

func H2HProdukRouter(mux *http.ServeMux, db *sql.DB) {
	authRepo := repository.NewMemberTrxMemberRepository(db)
	repo := repository.NewH2HProdukRepository(db)
	svc := service.NewH2HProdukService(authRepo, repo)
	ctrl := controller.NewH2HProdukController(svc)

	mux.HandleFunc("/v1/h2h/produk", ctrl.List)
}
