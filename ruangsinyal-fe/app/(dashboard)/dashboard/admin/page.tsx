"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, BadgeCheck, Landmark, Package, ReceiptText, Shield, Users, Wallet, Zap } from "lucide-react";

type MembersResp = {
  ok?: boolean;
  items?: Array<{ id: number }>;
  total_count?: number;
  total_saldo?: number;
};

type BankResp = {
  ok?: boolean;
  items?: Array<{
    saldo?: number;
    aktif?: boolean;
    admin_staff_only?: boolean;
  }>;
};

type ProviderWalletResp = {
  ok?: boolean;
  data?: Array<{
    provider: string;
    saldo_internal?: number;
    saldo_provider?: number;
    selisih?: number;
    snapshot_at?: string;
  }>;
};

type OverviewData = {
  retailCount: number;
  retailSaldo: number;
  totalBankSaldo: number;
  pulsa24JamSaldo: number;
};

function authHeader(): Record<string, string> {
  const t = localStorage.getItem("auth_token") || "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function fmtNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(Number.isFinite(n) ? n : 0);
}

function fmtCurrency(n: number): string {
  return `Rp ${fmtNumber(n)}`;
}

type StatTone = "red" | "orange" | "rose" | "amber";

function statToneClass(tone: StatTone) {
  if (tone === "orange") return "border-l-sky-500 border-sky-100 bg-white text-slate-950";
  if (tone === "rose") return "border-l-sky-500 border-sky-100 bg-white text-slate-950";
  if (tone === "amber") return "border-l-cyan-400 border-sky-100 bg-white text-slate-950";
  return "border-l-[#168AF2] border-sky-100 bg-white text-slate-950";
}

function iconToneClass(tone: StatTone) {
  if (tone === "orange") return "bg-sky-50 text-[#21D5ED] ring-2 ring-sky-100";
  if (tone === "rose") return "bg-sky-50 text-[#168AF2] ring-2 ring-sky-100";
  if (tone === "amber") return "bg-cyan-50 text-[#d97706] ring-2 ring-cyan-100";
  return "bg-sky-50 text-[#168AF2] ring-2 ring-sky-100";
}

export default function AdminHome() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OverviewData>({
    retailCount: 0,
    retailSaldo: 0,
    totalBankSaldo: 0,
    pulsa24JamSaldo: 0,
  });

  useEffect(() => {
    async function loadOverview() {
      setLoading(true);
      try {
        const [retailRes, bankRes, providerWalletRes] = await Promise.all([
          fetch("/api/admin/members?scope=retail&limit=1&offset=0", {
            headers: authHeader(),
            cache: "no-store",
          }),
          fetch("/api/admin/master/bank", {
            headers: authHeader(),
            cache: "no-store",
          }),
          fetch("/api/admin/provider/wallets", {
            headers: authHeader(),
            cache: "no-store",
          }),
        ]);

        const [retailJson, bankJson, providerWalletJson] = await Promise.all([
          retailRes.json().catch(() => ({} as MembersResp)),
          bankRes.json().catch(() => ({} as BankResp)),
          providerWalletRes.json().catch(() => ({} as ProviderWalletResp)),
        ]);

        const retailCount = retailRes.ok && retailJson.ok ? Number(retailJson.total_count || 0) : 0;
        const retailSaldo = retailRes.ok && retailJson.ok ? Number(retailJson.total_saldo || 0) : 0;
        const totalBankSaldo =
          bankRes.ok && bankJson.ok
            ? (Array.isArray(bankJson.items) ? bankJson.items : []).reduce(
                (sum: number, item: { saldo?: number; aktif?: boolean; admin_staff_only?: boolean }) =>
                  item.aktif !== false && !item.admin_staff_only
                    ? sum + Number(item.saldo || 0)
                    : sum,
                0
              )
            : 0;
        const pulsa24JamSaldo = providerWalletRes.ok && providerWalletJson.ok
          ? Number(
              (Array.isArray(providerWalletJson.data) ? providerWalletJson.data : []).find(
                (item: { provider: string; saldo_provider?: number }) => item.provider.toLowerCase() === "pulsa24jam"
              )?.saldo_provider || 0
            )
          : 0;

        setData({
          retailCount,
          retailSaldo,
          totalBankSaldo,
          pulsa24JamSaldo,
        });
      } finally {
        setLoading(false);
      }
    }

    void loadOverview();
  }, []);

  const stats = [
    { title: "Akun Pengguna", value: fmtNumber(data.retailCount), icon: Users, tone: "red" as StatTone, desc: "User dan agent RuangSinyal" },
    { title: "Saldo Pengguna", value: fmtCurrency(data.retailSaldo), icon: Wallet, tone: "orange" as StatTone, desc: "Total saldo utama pengguna" },
    { title: "Saldo Pembayaran", value: fmtCurrency(data.totalBankSaldo), icon: Landmark, tone: "amber" as StatTone, desc: "Rekening aktif untuk pembayaran pengguna" },
    { title: "Modal Pulsa24Jam", value: fmtCurrency(data.pulsa24JamSaldo), icon: Zap, tone: "rose" as StatTone, desc: "Saldo untuk memproses produk" },
  ];

  return (
    <div className="-m-2 min-h-screen bg-[#EFFBFF] p-3 text-slate-950 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[30px] border border-sky-100 bg-white shadow-[0_24px_60px_rgba(22,138,242,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#168AF2_0%,#35B6F2_54%,#21D5ED_130%)] p-5 text-white sm:p-7">
              <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/20 bg-white/10" />
              <div className="pointer-events-none absolute bottom-0 right-16 h-28 w-28 rounded-full border border-cyan-200/30" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(120deg,rgba(255,191,0,0.42),transparent_55%)]" />
              <p className="relative inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-sm">
                <Zap className="h-3.5 w-3.5 fill-cyan-300 text-cyan-300" />
                Super Admin RuangSinyal
              </p>
              <h1 className="relative mt-4 text-3xl font-black tracking-normal sm:text-4xl">
                Ringkasan Operasional
              </h1>
              <p className="relative mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/90">
                Pantau pengguna, kredit agent, transaksi, saldo, dan produk dari satu dashboard operasional RuangSinyal.
              </p>
              <div className="relative mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-3 py-1.5 text-xs font-black text-[#168AF2]">
                  <BadgeCheck className="h-4 w-4" />
                  Super Admin aktif
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-300 px-3 py-1.5 text-xs font-black text-[#062B74]">
                  <Shield className="h-4 w-4" />
                  Akses penuh
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3 bg-[#EFFBFF] p-5 sm:p-7">
              <div className="rounded-[24px] border border-sky-100 bg-white p-4 shadow-[0_14px_30px_rgba(22,138,242,0.08)]">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#168AF2]">Kesehatan Sistem</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{loading ? "Memuat..." : "Tersinkron"}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Data dashboard diambil langsung dari API internal RuangSinyal.</p>
              </div>
              <Link
                href="/dashboard/admin/integrasi/pulsa24jam"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[#168AF2] bg-white px-4 py-3 text-sm font-black text-[#168AF2] shadow-[0_12px_24px_rgba(22,138,242,0.10)] outline-none transition hover:bg-sky-50 focus-visible:ring-4 focus-visible:ring-sky-200"
              >
                Koneksi Pulsa24Jam
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={`rounded-[24px] border border-l-4 p-4 shadow-[0_16px_34px_rgba(22,138,242,0.07)] ${statToneClass(item.tone)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{item.title}</p>
                    <p className="mt-2 truncate text-2xl font-black text-slate-950">{loading ? "..." : item.value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.desc}</p>
                  </div>
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconToneClass(item.tone)}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-3 lg:grid-cols-3">
          {[
            {
              href: "/dashboard/admin/master/members",
              title: "Pengguna & Kredit",
              desc: "Kelola akun user, agent, marketing, dan pengajuan kredit.",
              icon: Users,
            },
            {
              href: "/dashboard/admin/transaksi/aplikasi",
              title: "Transaksi Pelanggan",
              desc: "Pantau pembelian produk dan status pemrosesannya.",
              icon: ReceiptText,
            },
            {
              href: "/dashboard/admin/master/produk",
              title: "Produk & Harga",
              desc: "Atur produk, harga jual, dan biaya layanan aplikasi.",
              icon: Package,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_16px_34px_rgba(22,138,242,0.07)] outline-none transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_20px_40px_rgba(22,138,242,0.11)] focus-visible:ring-4 focus-visible:ring-sky-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-black text-slate-950">{item.title}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.desc}</p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-[#168AF2] ring-2 ring-sky-100 transition group-hover:bg-[#168AF2] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <Link
            href="/dashboard/admin/pemantauan-tim?role=marketing"
            className="group flex min-h-28 items-center justify-between gap-4 rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_16px_34px_rgba(22,138,242,0.07)] transition hover:border-sky-300"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#168AF2]">Pemantauan Lapangan</p>
              <p className="mt-2 text-lg font-black text-slate-950">Aktivitas Marketing</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Lihat status akun dan pekerjaan lapangan tanpa masuk ke panel Marketing.</p>
            </div>
            <ArrowUpRight className="h-6 w-6 shrink-0 text-[#168AF2]" />
          </Link>
          <Link
            href="/dashboard/admin/pemantauan-tim?role=operator_credit"
            className="group flex min-h-28 items-center justify-between gap-4 rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_16px_34px_rgba(22,138,242,0.07)] transition hover:border-sky-300"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#21D5ED]">Pengawasan Kredit</p>
              <p className="mt-2 text-lg font-black text-slate-950">Aktivitas Operator Kredit</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Lihat keputusan dan aktivitas kredit tanpa masuk ke panel Operator.</p>
            </div>
            <ArrowUpRight className="h-6 w-6 shrink-0 text-[#21D5ED]" />
          </Link>
        </section>
      </div>
    </div>
  );
}
