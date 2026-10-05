package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// This operator-only command never modifies an existing account or calls a provider.
func main() {
	apply := flag.Bool("apply", false, "create the approved tester account and credit Rp300000")
	flag.Parse()
	if !*apply {
		fmt.Println("Dry run: creates tester@ruangsinyal.com as user with Rp300000 and an audited wallet credit; refuses an existing account")
		return
	}
	if err := createTester(); err != nil {
		log.Fatal(err)
	}
}

func createTester() error {
	if os.Getenv("DATABASE_URL") == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		return err
	}
	defer db.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock(7242402)`); err != nil {
		return err
	}
	const email = "tester@ruangsinyal.com"
	var exists bool
	if err := tx.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM public.member WHERE lower(email)=lower($1))`, email).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("tester account already exists; refusing to reset credentials or add more funds")
	}
	secret := make([]byte, 64)
	if _, err := rand.Read(secret); err != nil {
		return err
	}
	password := "Rs!" + hex.EncodeToString(secret[:10])
	apiKey := hex.EncodeToString(secret[32:])
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	var memberID int64
	if err := tx.QueryRowContext(ctx, `INSERT INTO public.member
 (email,nama,password_hash,pin_hash,role,aktif,retail_agent_commission_rp,retail_master_commission_rp,h2h_agent_commission_rp,h2h_master_commission_rp)
 VALUES ($1,'Tester RuangSinyal',$2,'','user',true,0,0,0,0) RETURNING id`, email, string(hash)).Scan(&memberID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `INSERT INTO public.member_api_key(member_id,api_key,label,aktif) VALUES($1,$2,'default',true)`, memberID, apiKey); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `INSERT INTO public.dompet_member(member_id,saldo) VALUES($1,0)`, memberID); err != nil {
		return err
	}
	ref := "TESTER-" + time.Now().UTC().Format("20060102T150405Z") + "-" + hex.EncodeToString(secret[20:24])
	if _, err := tx.ExecContext(ctx, `UPDATE public.dompet_member SET saldo=300000,diperbarui_pada=now() WHERE member_id=$1`, memberID); err != nil {
		return err
	}
	// A CLI operator has no authenticated member ID; record the approval explicitly instead of impersonating an admin.
	if _, err := tx.ExecContext(ctx, `INSERT INTO public.mutasi_dompet
 (member_id,ref_id,arah,jumlah,alasan,catatan,saldo_sebelum,saldo_sesudah,diubah_oleh,dibuat_pada)
 VALUES($1,$2,'CREDIT',300000,'admin manual credit','Owner-approved server tester funding Rp300000 via create_tester CLI on 2026-10-05; real P24 purchases authorized for account holder; no purchase executed by provisioning',0,300000,NULL,now())`, memberID, ref); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	return json.NewEncoder(os.Stdout).Encode(map[string]any{"email": email, "password": password, "member_id": memberID, "role": "user", "balance": 300000, "credit_ref": ref})
}
