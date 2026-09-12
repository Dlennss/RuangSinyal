import Link from "next/link";
import { ArrowUpRight, BookOpen, Code2, PlugZap, ReceiptText, Smartphone } from "lucide-react";

export function UserPulsaDataShortcut() {
  return (
    <section>
      <Link
        href="/user/pulsa-data"
        prefetch={false}
        className="group block overflow-hidden rounded-lg border border-sky-950/10 bg-[linear-gradient(135deg,#EFFBFF_0%,#ffffff_55%,#fff7df_100%)] p-5 shadow-[0_10px_24px_rgba(22,138,242,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(22,138,242,0.12)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#168AF2]">Shortcut Cepat</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Pulsa & Data by Nomor</h2>
            <p className="mt-2 text-sm text-slate-600">Masukkan nomor HP, deteksi operator otomatis, lalu pilih tab pulsa atau data tanpa cari brand manual.</p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-[#168AF2] transition group-hover:scale-105">
            <Code2 className="h-5 w-5" />
          </div>
        </div>
      </Link>
    </section>
  );
}

export function UserApiCTA() {
  return (
    <section>
      <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#168AF2_0%,#168AF2_58%,#21D5ED_130%)] p-4 text-white shadow-[0_20px_44px_rgba(22,138,242,0.24)] ring-1 ring-sky-200/20">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(135deg,rgba(33,213,237,0.18),rgba(255,196,0,0.08))]" />
        <div className="absolute inset-0 opacity-[0.12] bg-[repeating-radial-gradient(circle_at_0_100%,rgba(255,255,255,0.8)_0,rgba(255,255,255,0.8)_1px,transparent_1px,transparent_12px)] bg-size-[160%_130%]" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 ring-1 ring-white/15">
                <PlugZap className="h-3.5 w-3.5" />
                Kemitraan
              </div>
              <h2 className="mt-3 text-2xl leading-none font-black tracking-tight">API Reseller</h2>
              <p className="mt-2 max-w-[270px] text-sm leading-6 font-semibold text-white/78">
                Integrasi H2H untuk reseller, agen, dan website yang ingin transaksi otomatis.
              </p>
            </div>
            <div className="grid h-13 w-13 shrink-0 place-items-center rounded-[20px] bg-white/12 text-cyan-100 shadow-[0_12px_24px_rgba(0,0,0,0.16)] ring-1 ring-white/20">
              <Code2 className="h-6 w-6" strokeWidth={2.4} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/12">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/52">Mode</p>
              <p className="mt-0.5 text-xs font-black text-white">H2H API</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/12">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/52">Cocok</p>
              <p className="mt-0.5 text-xs font-black text-white">Agen & Web</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href="/docs"
              prefetch={false}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-3 text-sm font-black text-[#168AF2] shadow-[0_12px_24px_rgba(255,196,0,0.24)] transition hover:bg-cyan-200"
            >
              <BookOpen className="h-4 w-4" strokeWidth={2.5} />
              Dokumentasi
            </Link>
            <Link
              href="/artikel/cara-menjadi-member-h2h-ruangsinyal"
              prefetch={false}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/28 bg-white/10 px-3 text-sm font-black text-white! shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition hover:bg-white/15 visited:text-white! hover:text-white!"
            >
              Pelajari H2H
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function UserWeeklyPromo() {
  return (
    <section>
      <div className="h-44 rounded-lg bg-[linear-gradient(135deg,#168AF2_0%,#35B6F2_58%,#21D5ED_125%)] p-5 text-white shadow-sm">
        <p className="text-sm font-semibold text-white/90">Promo Mingguan</p>
        <h2 className="mt-2 max-w-70 text-2xl leading-tight font-bold">Yuk, isi kebutuhan digital lebih hemat!</h2>
      </div>
    </section>
  );
}

type UserHomeSummaryProps = {
  href?: string;
  variant?: "user" | "agent";
};

export function UserHomeSummary({ href = "/kategori", variant = "user" }: UserHomeSummaryProps) {
  return (
    <section className="rounded-[22px] border border-sky-950/10 bg-white px-4 py-3.5 shadow-[0_12px_28px_rgba(22,138,242,0.07)]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[#EFFBFF] text-[#168AF2] ring-1 ring-sky-100">
          <ReceiptText className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black leading-5 text-slate-950">
            {variant === "agent" ? "Mulai Transaksi Agent" : "Transaksi Kamu"}
          </h2>
          <p className="mt-1 text-xs font-semibold leading-4 text-slate-500">
            Belum ada transaksi baru.
          </p>
        </div>
        <Link
          href={href}
          prefetch={false}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[linear-gradient(135deg,#168AF2,#21D5ED)] text-white shadow-[0_12px_24px_rgba(215,7,23,0.18)] transition hover:-translate-y-0.5 hover:brightness-105"
          aria-label="Mulai transaksi"
        >
          <ArrowUpRight className="h-5 w-5" strokeWidth={2.6} />
        </Link>
      </div>
    </section>
  );
}

export function UserAboutSection() {
  return (
    <section>
      <div className="rounded-lg border border-sky-950/10 bg-white px-4 py-6 shadow-[0_10px_24px_rgba(22,138,242,0.08)]">
        <h3 className="text-lg leading-tight font-bold text-slate-900">RuangSinyal - Solusi Digital untuk Kebutuhan Sehari-hari</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 text-justify">
          RuangSinyal hadir sebagai platform digital untuk memenuhi kebutuhan transaksi online Anda. Tersedia pembayaran praktis dan harga kompetitif. 
          <span><Link href="/tentang" prefetch={false} className="text-[#168AF2]! hover:underline!">
            Selengkapnya
          </Link></span>
        </p>
      </div>
    </section>
  );
}
