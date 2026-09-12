package memberfeeprodukdto

import commondto "ruangsinyal/internal/dto/common"

func MapError(msg string) ErrorResponse {
	return commondto.MapError(msg)
}

func MapOK() OKResponse {
	return commondto.MapOK()
}

func MapList(items any) ListResponse {
	return commondto.MapList(items)
}
