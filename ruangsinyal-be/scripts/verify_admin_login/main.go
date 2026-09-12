package main

import (
	"context"
	"database/sql"
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
	password := strings.TrimSpace(os.Getenv("ADMIN_PASSWORD"))

	if dsn == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if email == "" || password == "" {
		log.Fatal("ADMIN_EMAIL and ADMIN_PASSWORD are required")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var id int64
	var role string
	var active bool
	var hash string
	err = db.QueryRowContext(ctx, `
SELECT id, role, aktif, COALESCE(password_hash, '')
FROM public.member
WHERE LOWER(email) = LOWER($1)
LIMIT 1`, email).Scan(&id, &role, &active, &hash)
	if err == sql.ErrNoRows {
		log.Fatalf("admin not found in this DATABASE_URL: %s", email)
	}
	if err != nil {
		log.Fatal(err)
	}

	passwordOK := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
	fmt.Printf("admin_check email=%s id=%d role=%s aktif=%t hash_set=%t password_ok=%t\n", email, id, role, active, strings.TrimSpace(hash) != "", passwordOK)
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}
