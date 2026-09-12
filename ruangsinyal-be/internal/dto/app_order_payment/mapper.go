package apporderpaymentdto

import commondto "ruangsinyal/internal/dto/common"

func MapError(msg string) ErrorResponse {
	return commondto.MapError(msg)
}

func MapItem(item any) ItemResponse {
	return commondto.MapItem(item)
}
