package router

import (
	"database/sql"
	"net/http"

	"ruangsinyal/ajs"
	"ruangsinyal/chytron"
	"ruangsinyal/gemilang"
	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/helper"
	"ruangsinyal/internal/repository"
	"ruangsinyal/internal/service"
	"ruangsinyal/javapay"
	"ruangsinyal/loketbayar"
	"ruangsinyal/minions"
	"ruangsinyal/multikom"
	"ruangsinyal/rajabiller"
	"ruangsinyal/sagaramobile"
	"ruangsinyal/smb"
	"ruangsinyal/talenta"
	"ruangsinyal/trionik"
	"ruangsinyal/yuscom"
)

type ProviderCallbackDeps struct {
	DB       *sql.DB
	JPClient *javapay.Client
	YSClient *yuscom.Client
	TLClient *talenta.Client
	MKClient *multikom.Client
	SGClient *sagaramobile.Client
	MNClient *minions.Client
	TRClient *trionik.Client
	AJClient *ajs.Client
	GMClient *gemilang.Client
	SMClient *smb.Client
	LBClient *loketbayar.Client
	CHClient *chytron.Client
	RJClient *rajabiller.Client
}

func ProviderCallbackRouter(mux *http.ServeMux, deps ProviderCallbackDeps) {
	repo := repository.NewProviderCallbackRepository(deps.DB)
	svc := service.NewProviderCallbackService(repo, deps.JPClient, deps.YSClient, deps.TLClient, deps.MKClient, deps.SGClient, deps.MNClient, deps.TRClient, deps.AJClient, deps.GMClient, deps.SMClient, deps.LBClient, deps.CHClient, deps.RJClient)
	ctrl := controller.NewProviderCallbackController(svc)

	mux.HandleFunc("/v1/webhook/javapay", helper.ProviderIPGuard("javapay", ctrl.CallbackJavapay))
	mux.HandleFunc("/v1/webhook/yuscom", helper.ProviderIPGuard("yuscom", ctrl.CallbackYuscom))
	mux.HandleFunc("/v1/webhook/multikom", helper.ProviderIPGuard("multikom", ctrl.CallbackMultikom))
	mux.HandleFunc("/v1/webhook/talenta", helper.ProviderIPGuard("talentapay", ctrl.CallbackTalenta))
	mux.HandleFunc("/v1/webhook/sagaramobile", helper.ProviderIPGuard("sagaramobile", ctrl.CallbackSagara))
	mux.HandleFunc("/v1/webhook/minions", helper.ProviderIPGuard("minions", ctrl.CallbackMinions))
	mux.HandleFunc("/v1/webhook/trionik", helper.ProviderIPGuard("trionik", ctrl.CallbackTrionik))
	mux.HandleFunc("/v1/webhook/tronik", helper.ProviderIPGuard("trionik", ctrl.CallbackTrionik))
	mux.HandleFunc("/v1/webhook/ajs", helper.ProviderIPGuard("ajs", ctrl.CallbackAJS))
	mux.HandleFunc("/v1/webhook/gemilang", helper.ProviderIPGuard("gemilang", ctrl.CallbackGemilang))
	mux.HandleFunc("/v1/webhook/smb", helper.ProviderIPGuard("smb", ctrl.CallbackSMB))
	mux.HandleFunc("/v1/webhook/loketbayar", helper.ProviderIPGuard("loketbayar", ctrl.CallbackLoketBayar))
	mux.HandleFunc("/v1/webhook/chytron", helper.ProviderIPGuard("chytron", ctrl.CallbackChytron))
	mux.HandleFunc("/v1/webhook/rajabiller", helper.ProviderIPGuard("rajabiller", ctrl.CallbackRajabiller))
	mux.HandleFunc("/v1/webhook/Pulsa24Jam", helper.ProviderIPGuard("Pulsa24Jam", ctrl.CallbackPulsa24Jam))

	mux.HandleFunc("/webhook/javapay", helper.ProviderIPGuard("javapay", ctrl.CallbackJavapay))
	mux.HandleFunc("/webhook/yuscom", helper.ProviderIPGuard("yuscom", ctrl.CallbackYuscom))
	mux.HandleFunc("/webhook/multikom", helper.ProviderIPGuard("multikom", ctrl.CallbackMultikom))
	mux.HandleFunc("/webhook/talenta", helper.ProviderIPGuard("talentapay", ctrl.CallbackTalenta))
	mux.HandleFunc("/webhook/sagaramobile", helper.ProviderIPGuard("sagaramobile", ctrl.CallbackSagara))
	mux.HandleFunc("/webhook/minions", helper.ProviderIPGuard("minions", ctrl.CallbackMinions))
	mux.HandleFunc("/webhook/trionik", helper.ProviderIPGuard("trionik", ctrl.CallbackTrionik))
	mux.HandleFunc("/webhook/tronik", helper.ProviderIPGuard("trionik", ctrl.CallbackTrionik))
	mux.HandleFunc("/webhook/ajs", helper.ProviderIPGuard("ajs", ctrl.CallbackAJS))
	mux.HandleFunc("/webhook/gemilang", helper.ProviderIPGuard("gemilang", ctrl.CallbackGemilang))
	mux.HandleFunc("/webhook/smb", helper.ProviderIPGuard("smb", ctrl.CallbackSMB))
	mux.HandleFunc("/webhook/loketbayar", helper.ProviderIPGuard("loketbayar", ctrl.CallbackLoketBayar))
	mux.HandleFunc("/webhook/chytron", helper.ProviderIPGuard("chytron", ctrl.CallbackChytron))
	mux.HandleFunc("/webhook/rajabiller", helper.ProviderIPGuard("rajabiller", ctrl.CallbackRajabiller))
	mux.HandleFunc("/webhook/Pulsa24Jam", helper.ProviderIPGuard("Pulsa24Jam", ctrl.CallbackPulsa24Jam))

	mux.HandleFunc("/v1/callback", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			helper.ProviderIPGuard("javapay", ctrl.CallbackJavapay)(w, r)
			return
		}
		if r.Method == http.MethodGet {
			helper.ProviderIPGuard("yuscom", ctrl.CallbackYuscom)(w, r)
			return
		}
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	})
	mux.HandleFunc("/v1/report", helper.ProviderIPGuard("yuscom", ctrl.CallbackYuscom))
	mux.HandleFunc("/report", helper.ProviderIPGuard("yuscom", ctrl.CallbackYuscom))
}
