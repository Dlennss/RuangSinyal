package main

import (
	"ruangsinyal/internal/repository"
	"strings"
	"testing"
)

func TestSnapshotValidation(t *testing.T) {
	item := repository.Pulsa24JamCatalogItem{SKU: "CAR", Name: "ASURANSI CAR", CategoryName: "Asuransi", BrandName: "Asuransi", PriceType: "FIXED", Price: 1000}
	valid := snapshot{SourceSHA256: strings.Repeat("a", 64), Products: []repository.Pulsa24JamCatalogItem{item}}
	if err := validateSnapshot(valid, 1); err != nil {
		t.Fatal(err)
	}
	if err := validateSnapshot(valid, 2); err == nil {
		t.Fatal("incomplete snapshot accepted")
	}
	duplicate := valid
	duplicate.Products = append(duplicate.Products, item)
	if err := validateSnapshot(duplicate, 2); err == nil {
		t.Fatal("duplicate SKU accepted")
	}
	invalid := valid
	invalid.SourceSHA256 = "bad"
	if err := validateSnapshot(invalid, 1); err == nil {
		t.Fatal("invalid source digest accepted")
	}
}
