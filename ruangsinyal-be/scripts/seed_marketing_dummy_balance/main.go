package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

const (
	targetEmail   = "marketing@ruangsinyal.com"
	targetBalance = int64(1_000_000)
)

func main() {
	log.SetFlags(0)

	_ = godotenv.Load(".env")

	dsn := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dsn == "" {
		log.Fatal("DATABASE_URL is empty")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("ping database: %v", err)
	}

	memberID, role, before, after, added, err := seedBalance(ctx, db)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("dummy balance ready: email=%s member_id=%d role=%s saldo_sebelum=%d saldo_sesudah=%d ditambah=%d\n", targetEmail, memberID, role, before, after, added)
}

func seedBalance(ctx context.Context, db *sql.DB) (memberID int64, role string, before int64, after int64, added int64, err error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return 0, "", 0, 0, 0, err
	}
	defer tx.Rollback()

	err = tx.QueryRowContext(ctx, `
SELECT id, COALESCE(role, '')
FROM public.member
WHERE lower(email) = lower($1)
LIMIT 1
`, targetEmail).Scan(&memberID, &role)
	if err == sql.ErrNoRows {
		return 0, "", 0, 0, 0, fmt.Errorf("akun %s tidak ditemukan", targetEmail)
	}
	if err != nil {
		return 0, "", 0, 0, 0, err
	}
	if strings.ToLower(strings.TrimSpace(role)) != "marketing" {
		return 0, "", 0, 0, 0, fmt.Errorf("akun %s role=%s, bukan marketing", targetEmail, role)
	}

	if _, err = tx.ExecContext(ctx, `
INSERT INTO public.dompet_member (member_id, saldo)
VALUES ($1, 0)
ON CONFLICT (member_id) DO NOTHING
`, memberID); err != nil {
		return 0, "", 0, 0, 0, err
	}

	if err = tx.QueryRowContext(ctx, `
SELECT saldo
FROM public.dompet_member
WHERE member_id = $1
FOR UPDATE
`, memberID).Scan(&before); err != nil {
		return 0, "", 0, 0, 0, err
	}

	after = before
	if before >= targetBalance {
		if err = tx.Commit(); err != nil {
			return 0, "", 0, 0, 0, err
		}
		return memberID, role, before, after, 0, nil
	}

	added = targetBalance - before
	after = targetBalance
	refID := "DUMMY-MARKETING-" + time.Now().Format("20060102150405")

	if _, err = tx.ExecContext(ctx, `
UPDATE public.dompet_member
SET saldo = $2, diperbarui_pada = now()
WHERE member_id = $1
`, memberID, after); err != nil {
		return 0, "", 0, 0, 0, err
	}

	if _, err = tx.ExecContext(ctx, `
INSERT INTO public.mutasi_dompet
  (member_id, ref_id, arah, jumlah, alasan, catatan, saldo_sebelum, saldo_sesudah, dibuat_pada)
VALUES
  ($1, $2, 'CREDIT', $3, 'DUMMY_TEST_BALANCE', 'Saldo dummy untuk tes produk RuangSinyal', $4, $5, now())
`, memberID, refID, added, before, after); err != nil {
		return 0, "", 0, 0, 0, err
	}

	if err = tx.Commit(); err != nil {
		return 0, "", 0, 0, 0, err
	}
	return memberID, role, before, after, added, nil
}
