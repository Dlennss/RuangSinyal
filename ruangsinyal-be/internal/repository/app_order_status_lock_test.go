package repository

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"io"
	"strings"
	"sync"
	"testing"
)

// This driver rejects unlocked reads and holds a row lock until transaction end.
type statusStore struct {
	mu        sync.Mutex
	status    string
	failWrite bool
}
type statusConnector struct{ store *statusStore }

func (c statusConnector) Connect(context.Context) (driver.Conn, error) {
	return &statusConn{store: c.store}, nil
}
func (c statusConnector) Driver() driver.Driver { return statusDriver{} }

type statusDriver struct{}

func (statusDriver) Open(string) (driver.Conn, error) { return nil, errors.New("use connector") }

type statusConn struct {
	store        *statusStore
	inTx, locked bool
	previous     string
}

func (c *statusConn) Prepare(string) (driver.Stmt, error) { return nil, errors.New("not supported") }
func (c *statusConn) Close() error                        { return nil }
func (c *statusConn) Begin() (driver.Tx, error)           { c.inTx = true; return c, nil }
func (c *statusConn) Commit() error {
	c.inTx = false
	if c.locked {
		c.locked = false
		c.store.mu.Unlock()
	}
	return nil
}
func (c *statusConn) Rollback() error {
	if c.locked {
		c.store.status = c.previous
	}
	return c.Commit()
}
func (c *statusConn) QueryContext(_ context.Context, q string, _ []driver.NamedValue) (driver.Rows, error) {
	if !c.inTx || !strings.Contains(q, "FOR UPDATE") {
		return nil, errors.New("status read without transactional row lock")
	}
	c.store.mu.Lock()
	c.locked = true
	c.previous = c.store.status
	return &statusRows{value: c.store.status}, nil
}
func (c *statusConn) ExecContext(_ context.Context, _ string, args []driver.NamedValue) (driver.Result, error) {
	if !c.locked {
		return nil, errors.New("unlocked status update")
	}
	if c.store.failWrite {
		return nil, errors.New("simulated write failure")
	}
	c.store.status = args[1].Value.(string)
	return driver.RowsAffected(1), nil
}

type statusRows struct {
	value string
	done  bool
}

func (*statusRows) Columns() []string { return []string{"status"} }
func (*statusRows) Close() error      { return nil }
func (r *statusRows) Next(values []driver.Value) error {
	if r.done || r.value == "" {
		return io.EOF
	}
	r.done = true
	values[0] = r.value
	return nil
}

func TestAppOrderStatusUpdatesLockAndPreserveTerminalStatus(t *testing.T) {
	for _, byID := range []bool{false, true} {
		store := &statusStore{status: "processing_provider"}
		db := sql.OpenDB(statusConnector{store})
		repo := NewAppOrderRepository(db)
		update := func(next string) error {
			if byID {
				return repo.UpdateStatusByID(context.Background(), 1, next)
			}
			return repo.UpdateStatusByInvoiceID(context.Background(), "test-invoice", next)
		}
		var wg sync.WaitGroup
		errs := make(chan error, 2)
		for _, next := range []string{"success", "paid"} {
			wg.Add(1)
			go func(next string) { defer wg.Done(); errs <- update(next) }(next)
		}
		wg.Wait()
		close(errs)
		for err := range errs {
			if err != nil {
				t.Fatal(err)
			}
		}
		if store.status != "success" {
			t.Fatalf("byID=%v status regressed to %s", byID, store.status)
		}
		store.status = "paid"
		store.failWrite = true
		if err := update("success"); err == nil {
			t.Fatal("write failure hidden")
		}
		if store.status != "paid" {
			t.Fatal("failed transaction changed status")
		}
		store.failWrite = false
		store.status = ""
		if err := update("paid"); !errors.Is(err, sql.ErrNoRows) {
			t.Fatalf("missing row: %v", err)
		}
		db.Close()
	}
}
