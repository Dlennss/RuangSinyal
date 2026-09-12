package router

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"ruangsinyal/ajs"
	"ruangsinyal/chytron"
	"ruangsinyal/gemilang"
	"ruangsinyal/internal/controller"
	"ruangsinyal/internal/provider"
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

type MemberTrxDeps struct {
	DB           *sql.DB
	YSClient     *yuscom.Client
	JPClient     *javapay.Client
	TLClient     *talenta.Client
	MKClient     *multikom.Client
	SGClient     *sagaramobile.Client
	MNClient     *minions.Client
	TRClient     *trionik.Client
	AJClient     *ajs.Client
	GMClient     *gemilang.Client
	SMClient     *smb.Client
	LBClient     *loketbayar.Client
	CHClient     *chytron.Client
	RJClient     *rajabiller.Client
	ExtraClients []provider.Client
}

func MemberTrxRouter(mux *http.ServeMux, deps MemberTrxDeps) {
	repo := repository.NewMemberTrxRepository(deps.DB)
	svc := service.NewMemberTrxService(repo, deps.YSClient, deps.JPClient, deps.TLClient, deps.MKClient, deps.SGClient, deps.MNClient, deps.TRClient, deps.AJClient, deps.GMClient, deps.SMClient, deps.LBClient, deps.CHClient, deps.RJClient, deps.ExtraClients...)
	ctrl := controller.NewMemberTrxController(svc)

	mux.HandleFunc("/v1/trx", ctrl.Handle)

	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 55*time.Second)
			n := svc.RetryPendingTransactions(ctx)
			cancel()
			if n > 0 {
				log.Printf("[retry_pending] %d transaksi di-retry", n)
			}
		}
	}()

	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 55*time.Second)
			n := svc.RetryPendingCallbackWaitProviders(ctx)
			cancel()
			if n > 0 {
				log.Printf("[retry_pending_callback_wait] %d transaksi di-retry", n)
			}
		}
	}()
}
