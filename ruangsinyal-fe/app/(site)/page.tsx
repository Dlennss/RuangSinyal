import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  BadgeCheck,
  Banknote,
  ChevronRight,
  Clock3,
  Gamepad2,
  Landmark,
  MessageCircle,
  ShieldCheck,
  Signal,
  Smartphone,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";

const siteTitle = "Pijarivo | Website Top Up Pulsa, Data, E-Wallet, Game & PPOB";
const siteDescription =
  "Pijarivo adalah website transaksi digital untuk isi pulsa, paket data, e-wallet, token listrik, game, dan PPOB dengan alur sederhana.";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  keywords: [
    "Pijarivo",
    "website isi pulsa",
    "top up pulsa online",
    "paket data",
    "e-wallet",
    "top up game",
    "PPOB",
  ],
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "Pijarivo",
    type: "website",
    images: [
      {
        url: "/pijarivo-assets/hero-topup-3d.png",
        width: 1340,
        height: 1024,
        alt: "Ilustrasi layanan digital Pijarivo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/pijarivo-assets/hero-topup-3d.png"],
  },
};

const products = [
  { name: "Pulsa & Data", note: "Operator populer, nominal lengkap", icon: Smartphone },
  { name: "E-Wallet", note: "Saldo digital untuk kebutuhan harian", icon: WalletCards },
  { name: "Token PLN", note: "Token dan tagihan listrik praktis", icon: Zap },
  { name: "Top Up Game", note: "Voucher game dan item favorit", icon: Gamepad2 },
  { name: "PPOB", note: "BPJS, PDAM, TV, internet, dan lainnya", icon: Landmark },
  { name: "Riwayat", note: "Pantau status transaksi kapan saja", icon: Clock3 },
];

const steps = [
  "Pilih produk yang kamu butuhkan.",
  "Masukkan nomor tujuan atau ID pelanggan.",
  "Bayar dan pantau status transaksi secara langsung.",
];

const advantages = [
  { title: "Mudah dipakai", copy: "Tampilan web rapi, ringan, dan enak dibuka dari laptop maupun ponsel." },
  { title: "Pilihan lengkap", copy: "Satu tempat untuk pulsa, data, e-wallet, listrik, game, dan layanan PPOB." },
  { title: "Aman dipantau", copy: "Riwayat transaksi jelas agar pembeli dan admin tidak perlu menebak status." },
];

function LogoMark() {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-linear-to-br from-[#ff4d4d] via-[#ff7a1a] to-[#ffd34d] shadow-[0_14px_32px_rgba(255,96,31,0.30)]">
      <Signal className="h-6 w-6 text-white" strokeWidth={3} />
    </span>
  );
}

export default function PijarivoHomePage() {
  return (
    <main className="min-h-screen bg-[#fff8f0] text-[#3b1330]">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_28%,rgba(255,130,50,0.24),transparent_28%),radial-gradient(circle_at_90%_30%,rgba(255,203,118,0.40),transparent_23%),linear-gradient(180deg,#fff8f0_0%,#fffaf6_58%,#ffffff_100%)]" />

        <header className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between rounded-b-[28px] border border-white/80 bg-white/84 px-4 py-3 shadow-[0_18px_54px_rgba(74,29,58,0.12)] backdrop-blur md:mt-4 md:rounded-[28px] md:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Pijarivo">
            <LogoMark />
            <span className="text-xl font-black tracking-tight text-[#561546]">Pijarivo</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-[#735467] md:flex">
            <a href="#produk" className="hover:text-[#561546]">Produk</a>
            <a href="#cara-beli" className="hover:text-[#561546]">Cara beli</a>
            <a href="#keunggulan" className="hover:text-[#561546]">Keunggulan</a>
            <Link href="/transaksi" className="hover:text-[#561546]">Transaksi</Link>
            <Link href="/login" className="hover:text-[#561546]">Masuk</Link>
          </nav>

          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-full bg-linear-to-r from-[#ff5b3d] to-[#ff8b1f] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(255,107,35,0.28)]"
          >
            Daftar gratis
          </Link>
        </header>

        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-10 py-14 md:min-h-[calc(100vh-100px)] md:grid-cols-[0.92fr_1.08fr] md:py-12">
          <div className="relative order-2 md:order-1">
            <div className="absolute left-2 top-6 z-10 rotate-[-4deg] rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#561546] shadow-[0_18px_34px_rgba(72,26,54,0.12)]">
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#ff5b3d]" />
                Gampang banget!
              </span>
            </div>
            <div className="relative mx-auto aspect-square max-w-[520px]">
              <div className="absolute inset-10 rounded-full bg-[#ffd79f]/60 blur-2xl" />
              <Image
                src="/pijarivo-assets/hero-topup-3d.png"
                alt="Ilustrasi layanan top up Pijarivo"
                fill
                priority
                sizes="(min-width: 768px) 520px, 92vw"
                className="relative object-contain drop-shadow-[0_28px_44px_rgba(108,46,43,0.20)]"
              />
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-[#ffe3c3] px-4 py-3 text-sm font-black text-[#68134e]">
              <Sparkles className="h-4 w-4 text-[#ff5b3d]" />
              Top up gampang, untuk semua
            </div>
            <h1 className="max-w-2xl text-6xl font-black leading-[0.98] tracking-normal text-[#561546] md:text-7xl lg:text-8xl">
              Pijarivo
            </h1>
            <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#806172]">
              Website isi pulsa, paket data, e-wallet, token listrik, game, dan PPOB dengan tampilan ramah, pilihan lengkap, serta alur transaksi yang tidak bikin pusing.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#produk"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#561546] px-7 text-base font-black text-white shadow-[0_18px_34px_rgba(86,21,70,0.24)]"
              >
                Lihat produk
                <ChevronRight className="h-5 w-5" strokeWidth={3} />
              </Link>
              <Link
                href="/transaksi"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-[#ffd2b4] bg-white px-7 text-base font-black text-[#561546]"
              >
                Cek transaksi
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="produk" className="bg-white py-16">
        <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ff6b2d]">Produk</p>
              <h2 className="mt-3 text-4xl font-black tracking-normal text-[#461238]">Semua kebutuhan digital di satu website.</h2>
            </div>
            <p className="max-w-md text-base font-semibold leading-7 text-[#7b6472]">
              Dibuat untuk pembeli harian, konter, reseller, dan tim yang butuh transaksi cepat dari browser.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const Icon = product.icon;
              return (
                <Link
                  key={product.name}
                  href="/kategori"
                  className="group rounded-[8px] border border-[#ffe0cc] bg-[#fffaf6] p-5 shadow-[0_14px_30px_rgba(92,34,57,0.06)] transition hover:-translate-y-1 hover:border-[#ffb279]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-[8px] bg-white text-[#ff6336] shadow-[0_10px_24px_rgba(255,111,45,0.14)]">
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                  <h3 className="mt-5 text-xl font-black text-[#461238]">{product.name}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#806172]">{product.note}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="cara-beli" className="bg-[#fff8f0] py-16">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ff6b2d]">Cara beli</p>
            <h2 className="mt-3 text-4xl font-black tracking-normal text-[#461238]">Tiga langkah, langsung jalan.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-[8px] bg-white p-6 shadow-[0_14px_30px_rgba(92,34,57,0.07)]">
                <span className="text-sm font-black text-[#ff6b2d]">0{index + 1}</span>
                <p className="mt-4 text-lg font-black leading-7 text-[#461238]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="keunggulan" className="bg-white py-16">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ff6b2d]">Keunggulan</p>
            <h2 className="mt-3 text-4xl font-black tracking-normal text-[#461238]">Website yang terasa ringan, jelas, dan siap dipakai.</h2>
            <div className="mt-8 grid gap-4">
              {advantages.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff0df] text-[#ff6336]">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-[#461238]">{item.title}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#806172]">{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-[#ffe0cc] bg-[#fffaf6] p-5 shadow-[0_20px_42px_rgba(92,34,57,0.08)]">
            <div className="rounded-[8px] bg-[#561546] p-5 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white/70">Transaksi hari ini</p>
                  <p className="mt-1 text-3xl font-black">1.248</p>
                </div>
                <Banknote className="h-10 w-10 text-[#ffd17a]" />
              </div>
              <div className="mt-6 h-3 rounded-full bg-white/15">
                <div className="h-3 w-[76%] rounded-full bg-linear-to-r from-[#ffd34d] to-[#ff6b2d]" />
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {["Pulsa Telkomsel 50K", "Token PLN 100K", "Top Up E-Wallet"].map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-[8px] bg-white px-4 py-3">
                  <span className="font-bold text-[#461238]">{item}</span>
                  <span className="rounded-full bg-[#e9fff2] px-3 py-1 text-xs font-black text-[#137d43]">
                    {index === 2 ? "Diproses" : "Sukses"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fff8f0] py-14">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col items-start justify-between gap-5 rounded-[8px] bg-[#461238] px-6 py-7 text-white md:flex-row md:items-center md:px-8">
          <div>
            <h2 className="text-3xl font-black tracking-normal">Mulai transaksi di Pijarivo.</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/72">
              Masuk sebagai pengguna lama atau daftar gratis untuk menikmati pengalaman website yang lebih rapi.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-[#461238]"
          >
            Daftar sekarang
            <MessageCircle className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
