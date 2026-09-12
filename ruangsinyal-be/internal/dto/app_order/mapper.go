package apporderdto

import (
	commondto "ruangsinyal/internal/dto/common"
	"ruangsinyal/internal/repository"
)

func MapCreateRequestToInput(req CreateRequest) repository.AppOrderCreateInput {
	return repository.AppOrderCreateInput{
		ProdukID:             req.ProdukID,
		Dest:                 req.Dest,
		Qty:                  req.Qty,
		GuestNama:            req.GuestNama,
		GuestEmail:           req.GuestEmail,
		GuestPhone:           req.GuestPhone,
		SourceCheckInvoiceID: req.SourceCheckInvoiceID,
		SourceCheckRefID:     req.SourceCheckRefID,
	}
}

func MapError(msg string) ErrorResponse {
	return commondto.MapError(msg)
}

func MapItem(item any) ItemResponse {
	return commondto.MapItem(item)
}

func MapList(items any) commondto.ListResponse {
	return commondto.ListResponse{Ok: true, Items: items}
}
