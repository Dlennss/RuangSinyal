package scripts

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
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

func TestReleaseRetention(t *testing.T) {
	if runtime.GOOS != "linux" {
		t.Skip("production retention uses Linux find/sort and symlinks")
	}
	helper, err := filepath.Abs("release-retention.sh")
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		name, keep                 string
		broken, outside, wantError bool
		want                       []string
	}{
		{name: "mixed names protect active and rollback", keep: "3", want: []string{"build-20261005204857", "build-p24-reference-previous", "build-newest-other"}},
		{name: "one still retains rollback", keep: "1", want: []string{"build-20261005204857", "build-p24-reference-previous"}},
		{name: "zero rejected", keep: "0", wantError: true},
		{name: "invalid rejected", keep: "invalid", wantError: true},
		{name: "dangling current prevents deletion", keep: "3", broken: true, wantError: true},
		{name: "external current prevents deletion", keep: "3", outside: true, wantError: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			root := filepath.Join(t.TempDir(), "releases with spaces")
			if err := os.Mkdir(root, 0755); err != nil {
				t.Fatal(err)
			}
			names := []string{"build-20261005204857", "build-p24-reference-previous", "build-p24-zzz-old", "build-newest-other"}
			for i, name := range names {
				path := filepath.Join(root, name)
				if err := os.Mkdir(path, 0755); err != nil {
					t.Fatal(err)
				}
				stamp := time.Unix(1700000000+int64(i), 0)
				if err := os.Chtimes(path, stamp, stamp); err != nil {
					t.Fatal(err)
				}
			}
			active := filepath.Join(root, names[0])
			linkTarget := active
			if tc.broken {
				linkTarget = filepath.Join(root, "build-missing")
			}
			outside := t.TempDir()
			marker := filepath.Join(outside, "untouched")
			if err := os.WriteFile(marker, []byte("preserve"), 0600); err != nil {
				t.Fatal(err)
			}
			if tc.outside {
				linkTarget = outside
			}
			if err := os.Symlink(linkTarget, filepath.Join(root, "current")); err != nil {
				t.Fatal(err)
			}
			if err := os.Symlink(outside, filepath.Join(root, "build-external")); err != nil {
				t.Fatal(err)
			}
			cmd := exec.Command("bash", "-c", `set -euo pipefail; source "$1"; prune_backend_releases "$2" "$3" "$4" "$5"`, "retention-test", helper, root, tc.keep, active, filepath.Join(root, names[1]))
			output, err := cmd.CombinedOutput()
			if (err != nil) != tc.wantError {
				t.Fatalf("error=%v, output=%s", err, output)
			}
			want := tc.want
			if tc.wantError {
				want = names
			}
			for _, name := range names {
				_, err := os.Stat(filepath.Join(root, name))
				expected := false
				for _, retained := range want {
					if name == retained {
						expected = true
					}
				}
				if expected && err != nil {
					t.Errorf("protected release %s missing: %v", name, err)
				}
				if !expected && !os.IsNotExist(err) {
					t.Errorf("obsolete release %s not removed: %v", name, err)
				}
			}
			if _, err := os.Stat(marker); err != nil {
				t.Fatalf("external path changed: %v", err)
			}
		})
	}
}
