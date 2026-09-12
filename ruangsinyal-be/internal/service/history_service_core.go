package service

import "ruangsinyal/internal/repository"

type HistoryService struct {
	repo   *repository.HistoryRepository
	trxSvc *MemberTrxService
}

func NewHistoryService(repo *repository.HistoryRepository, trxSvc *MemberTrxService) *HistoryService {
	return &HistoryService{repo: repo, trxSvc: trxSvc}
}
