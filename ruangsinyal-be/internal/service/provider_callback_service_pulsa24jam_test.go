package service

import "testing"

func TestPulsa24JamNestedFinalStatus(t *testing.T) {
	for _, tc := range []struct{ name, body, want, ref string }{
		{"nested success", `{"ok":true,"transaksi_member":{"status":2,"ref_id":"RSA3","biaya_perkiraan":101000,"keterangan":"REFF:12345"}}`, "success", "RSA3"},
		{"nested string success", `{"ok":true,"transaksi_member":{"status":"2","ref_id":"RSA3"}}`, "success", "RSA3"},
		{"nested pending", `{"ok":true,"transaksi_member":{"status":1,"ref_id":"RSA3"}}`, "pending", "RSA3"},
		{"nested failed", `{"ok":true,"transaksi_member":{"status":3,"ref_id":"RSA3"}}`, "failed", "RSA3"},
		{"flat success", `{"status":2,"refid":"RSA3"}`, "success", "RSA3"},
		{"flat text success", `{"status":"success","refid":"RSA3"}`, "success", "RSA3"},
		{"acceptance only", `{"ok":true,"refid":"RSA3"}`, "pending", "RSA3"},
		{"unknown", `{"transaksi_member":{"status":99,"ref_id":"RSA3"}}`, "pending", "RSA3"},
		{"invalid", `{`, "pending", ""},
	} {
		t.Run(tc.name, func(t *testing.T) {
			data := parsePulsa24JamCallback(tc.body, nil, nil)
			if got := Pulsa24JamFinalStatus(data); got != tc.want || data.refid != tc.ref {
				t.Fatalf("status=%s ref=%s", got, data.refid)
			}
			if data.price != 0 {
				t.Fatal("estimated costs must not become actual provider costs")
			}
		})
	}
}
