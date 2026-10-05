package scripts

import (
	"os"
	"strings"
	"testing"
)

func TestProductionDeploymentDoesNotResetCatalogOrSeedDemoMoney(t *testing.T) {
	content, err := os.ReadFile("deploy-prod-release.sh")
	if err != nil {
		t.Fatal(err)
	}
	for _, forbidden := range []string{"20260910_clear_product_catalog.sql", "20260910_seed_marketing_dummy_balance.sql", "seed_marketing_dummy_balance"} {
		if strings.Contains(string(content), forbidden) {
			t.Fatalf("production deployment contains unsafe data operation: %s", forbidden)
		}
	}
}
