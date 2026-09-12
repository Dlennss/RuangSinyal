package router

import (
	"database/sql"
	"net/http"
	"time"

	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/helper"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
)

var authLimiter = helper.NewRateLimiter(10, 1*time.Minute)

func AuthRouter(mux *http.ServeMux, wrap Middleware, db *sql.DB, jwtSecret []byte) {
	repo := repository.NewAuthRepository(db)
	orderRepo := repository.NewAppOrderRepository(db)
	svc := service.NewAuthService(repo, orderRepo, jwtSecret)
	ctrl := controller.NewAuthController(svc)

	// New paths
	mux.HandleFunc("/v1/auth/login", authLimiter.Wrap(ctrl.Login))
	mux.HandleFunc("/v1/auth/refresh", ctrl.Refresh)
	mux.HandleFunc("/v1/auth/google", authLimiter.Wrap(ctrl.LoginGoogle))
	mux.HandleFunc("/v1/auth/apple", authLimiter.Wrap(ctrl.LoginApple))
	mux.HandleFunc("/v1/webhook/apple", ctrl.AppleWebhook)
	mux.HandleFunc("/v1/auth/register", authLimiter.Wrap(ctrl.Register))
	mux.HandleFunc("/v1/auth/register/public", authLimiter.Wrap(ctrl.RegisterPublic))
	mux.HandleFunc("/v1/auth/me", wrap(ctrl.Me))
}
