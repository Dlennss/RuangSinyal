package repository

import "testing"

func TestValidatePulsa24JamCatalog(t *testing.T) {
	valid := Pulsa24JamCatalogItem{SKU: "UDDND10", Name: "Dana 10.000", CategoryName: "E-Wallet", BrandName: "DANA", PriceType: "FIXED", Price: 11055}
	tests := []struct {
		name  string
		items []Pulsa24JamCatalogItem
		valid bool
	}{
		{"exact upstream item", []Pulsa24JamCatalogItem{valid}, true},
		{"empty cannot retire catalog", nil, false},
		{"duplicate SKU", []Pulsa24JamCatalogItem{valid, valid}, false},
	}
	for _, field := range []string{"brand", "category", "name", "sku", "priceType", "price"} {
		item := valid
		switch field {
		case "brand":
			item.BrandName = ""
		case "category":
			item.CategoryName = ""
		case "name":
			item.Name = ""
		case "sku":
			item.SKU = ""
		case "priceType":
			item.PriceType = "UNKNOWN"
		case "price":
			item.Price = -1
		}
		tests = append(tests, struct {
			name  string
			items []Pulsa24JamCatalogItem
			valid bool
		}{field, []Pulsa24JamCatalogItem{valid, item}, false})
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := validatePulsa24JamCatalog(tt.items)
			if (err == nil) != tt.valid {
				t.Fatalf("validation error = %v", err)
			}
			if tt.valid && got[0] != valid {
				t.Fatalf("upstream product changed: %+v", got[0])
			}
		})
	}
}
