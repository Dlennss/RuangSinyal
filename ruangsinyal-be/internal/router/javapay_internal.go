package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/db"
	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/helper"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
	"ruangsinyal/javapay"
)

type JavapayInternalDeps struct {
	DB       *sql.DB
	JPClient *javapay.Client
}

func JavapayInternalRouter(mux *http.ServeMux, deps JavapayInternalDeps) {
	dbRepo := db.NewJavapayRepo(deps.DB)
	repo := repository.NewJavapayInternalRepository(dbRepo)
	svc := service.NewJavapayInternalService(repo, deps.JPClient)
	ctrl := controller.NewJavapayInternalController(svc)

	mux.HandleFunc("/internal/javapay/trx", helper.RequireInternalSecret(ctrl.HandleTrx))
	mux.HandleFunc("/internal/javapay/produk", helper.RequireInternalSecret(ctrl.HandleProduk))
}
