package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dsn := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	email := strings.ToLower(strings.TrimSpace(getEnv("ADMIN_EMAIL", "admin@ruangsinyal.com")))
	name := strings.TrimSpace(getEnv("ADMIN_NAME", "Admin RuangSinyal"))
	password := strings.TrimSpace(os.Getenv("ADMIN_PASSWORD"))

	if dsn == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if email == "" {
		log.Fatal("ADMIN_EMAIL is required")
	}
	if len(password) < 8 {
		log.Fatal("ADMIN_PASSWORD is required and must be at least 8 characters")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatal(err)
	}

	hasPhone, err := columnExists(ctx, db, "public", "member", "phone")
	if err != nil {
		log.Fatal(err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}

	memberID, err := upsertAdmin(ctx, db, hasPhone, email, name, string(hash))
	if err != nil {
		log.Fatal(err)
	}

	if err := ensureWallet(ctx, db, memberID); err != nil {
		log.Fatal(err)
	}
	if err := ensureAPIKey(ctx, db, memberID); err != nil {
		log.Fatal(err)
	}

	fmt.Printf("admin ready: id=%d email=%s role=admin aktif=true\n", memberID, email)
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func columnExists(ctx context.Context, db *sql.DB, schemaName, tableName, columnName string) (bool, error) {
	var exists bool
	err := db.QueryRowContext(ctx, `
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
)`, schemaName, tableName, columnName).Scan(&exists)
	return exists, err
}

func tableExists(ctx context.Context, db *sql.DB, tableName string) (bool, error) {
	var exists bool
	err := db.QueryRowContext(ctx, `SELECT to_regclass($1) IS NOT NULL`, tableName).Scan(&exists)
	return exists, err
}

func upsertAdmin(ctx context.Context, db *sql.DB, hasPhone bool, email, name, passwordHash string) (int64, error) {
	var row *sql.Row
	if hasPhone {
		row = db.QueryRowContext(ctx, `
INSERT INTO public.member (
  email, nama, phone, password_hash, pin_hash, role, aktif,
  charge_receiver, fee_member_rp, retail_agent_commission_rp, retail_master_commission_rp,
  h2h_agent_commission_rp, h2h_master_commission_rp
)
VALUES ($1, $2, '', $3, '', 'admin', true, false, 0, 0, 0, 0, 0)
ON CONFLICT (email) DO UPDATE SET
  nama = EXCLUDED.nama,
  password_hash = EXCLUDED.password_hash,
  role = 'admin',
  aktif = true,
  diubah_pada = now()
RETURNING id`, email, name, passwordHash)
	} else {
		row = db.QueryRowContext(ctx, `
INSERT INTO public.member (
  email, nama, password_hash, pin_hash, role, aktif,
  charge_receiver, fee_member_rp, retail_agent_commission_rp, retail_master_commission_rp,
  h2h_agent_commission_rp, h2h_master_commission_rp
)
VALUES ($1, $2, $3, '', 'admin', true, false, 0, 0, 0, 0, 0)
ON CONFLICT (email) DO UPDATE SET
  nama = EXCLUDED.nama,
  password_hash = EXCLUDED.password_hash,
  role = 'admin',
  aktif = true,
  diubah_pada = now()
RETURNING id`, email, name, passwordHash)
	}

	var memberID int64
	if err := row.Scan(&memberID); err != nil {
		return 0, err
	}
	return memberID, nil
}

func ensureWallet(ctx context.Context, db *sql.DB, memberID int64) error {
	exists, err := tableExists(ctx, db, "public.dompet_member")
	if err != nil || !exists {
		return err
	}
	_, err = db.ExecContext(ctx, `
INSERT INTO public.dompet_member (member_id, saldo)
VALUES ($1, 0)
ON CONFLICT (member_id) DO NOTHING`, memberID)
	return err
}

func ensureAPIKey(ctx context.Context, db *sql.DB, memberID int64) error {
	exists, err := tableExists(ctx, db, "public.member_api_key")
	if err != nil || !exists {
		return err
	}

	var count int
	if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM public.member_api_key WHERE member_id = $1`, memberID).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	apiKey, err := randomHex(32)
	if err != nil {
		return err
	}
	_, err = db.ExecContext(ctx, `
INSERT INTO public.member_api_key (member_id, api_key, label, aktif)
VALUES ($1, $2, 'default', true)`, memberID, apiKey)
	return err
}

func randomHex(size int) (string, error) {
	if size <= 0 {
		return "", errors.New("invalid random size")
	}
	buf := make([]byte, size)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}
