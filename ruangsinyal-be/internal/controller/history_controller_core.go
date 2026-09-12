package controller

import "ruangsinyal/internal/service"

type HistoryController struct {
	svc *service.HistoryService
}

func NewHistoryController(svc *service.HistoryService) *HistoryController {
	return &HistoryController{svc: svc}
}
