package repository

import (
	"context"
	"testing"
)

func TestP24CallbackProviderName(t *testing.T) {
	r := NewProviderCallbackRepository(nil)
	for _, name := range []string{"Pulsa24Jam", "pulsa24jam", " PULSA24JAM "} {
		got, err := r.normalizeProviderForCallback(context.Background(), name)
		if err != nil || got != "pulsa24jam" {
			t.Fatalf("normalize(%q) = %q, %v", name, got, err)
		}
	}
}
