"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Search,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DirectoryMode = "guest" | "user";

type ServiceItem = {
  label: string;
  href: string;
  iconKey: string;
};

type ServiceGroup = {
  id: string;
  title: string;
  eyebrow: string;
  items: ServiceItem[];
};

type ServiceDirectoryProps = {
  mode?: DirectoryMode;
  role?: string | null;
};

const guestPath = {
  pulsaData: "/pulsa-data",
  pulsa: "/pulsa",
  paketData: "/paket-data",
  ewallet: "/ewallet",
  transferBank: "/kategori?layanan=transfer-bank",
  game: "/game",
  pln: "/listrik",
  tokenPln: "/listrik/token",
  pdam: "/pdam",
  pgn: "/pgn",
  bpjs: "/bpjs",
  tv: "/tv",
  internet: "/internet-pascabayar",
  hpPascabayar: "/hp-pascabayar",
};

const userPath = {
  pulsaData: "/user/pulsa-data",
  pulsa: "/user/pulsa",
  paketData: "/user/paket-data",
  ewallet: "/user/ewallet",
  transferBank: "/user/transfer-bank",
  game: "/user/kategori?layanan=voucher-game",
  pln: "/user/listrik",
  tokenPln: "/user/listrik/token",
  pdam: "/user/kategori?layanan=pdam",
  pgn: "/user/kategori?layanan=gas-pgn",
  bpjs: "/user/kategori?layanan=bpjs",
  tv: "/user/kategori?layanan=tv-kabel",
  internet: "/user/kategori?layanan=internet-wifi",
  hpPascabayar: "/user/kategori/hp-pascabayar",
  esimRoaming: "/user/kategori/esim-roaming",
};

function fallbackPath(mode: DirectoryMode, slug: string) {
  return mode === "user" ? `/user/kategori?layanan=${slug}` : `/kategori?layanan=${slug}`;
}

function isAgentRole(role?: string | null) {
  const normalized = String(role || "").trim().toLowerCase();
  return normalized === "agent" || normalized === "retail_agent" || normalized === "agent_retail";
}

const iconPath = {
  pulsa: "pulsa.png",
  paketData: "paket-data.png",
  hpPascabayar: "hp-pascabayar.png",
  esimRoaming: "esim-roaming.png",
  ewallet: "ewallet.png",
  transferBank: "transfer-bank.png",
  qris: "qris.png",
  uangElektronik: "uang-elektronik.png",
  kartuKredit: "kartu-kredit.png",
  asuransi: "asuransi.png",
  bpjs: "bpjs.png",
  tokenPln: "token-pln.png",
  pdam: "pdam.png",
  gasPgn: "gas-pgn.png",
  internetWifi: "internet-wifi.png",
  tvKabel: "tv-kabel.png",
  voucherGame: "voucher-game.png",
  voucherDigital: "voucher-digital.png",
  streamingMusik: "streaming-musik.png",
  klinikKesehatan: "klinik-kesehatan.png",
  uangSekolah: "uang-sekolah.png",
  cicilanKendaraan: "cicilan-kendaraan.png",
  cicilanMultifinance: "cicilan-multifinance.png",
  pbb: "pbb.png",
  pajakNegara: "pajak-negara.png",
  tiketPerjalanan: "tiket-perjalanan.png",
  saldoKartuTol: "saldo-kartu-tol.png",
  parkirDigital: "parkir-digital.png",
  kurirPengiriman: "kurir-pengiriman.png",
  zakatDonasi: "zakat-donasi.png",
};

function DirectoryServiceIcon({ iconSrc, label }: { iconSrc: string; label: string }) {
  return (
    <span className="relative grid h-[58px] w-[58px] place-items-center transition duration-300 group-hover:-translate-y-0.5">
      <Image
        src={iconSrc}
        alt={label}
        width={58}
        height={58}
        className="h-[58px] w-[58px] object-contain drop-shadow-[0_8px_10px_rgba(22,138,242,0.12)]"
      />
    </span>
  );
}

function getGroups(mode: DirectoryMode, role?: string | null): ServiceGroup[] {
  const path = mode === "user" ? userPath : guestPath;
  const normalizedRole = String(role || "").trim().toLowerCase();
  const canUseAgentCredit = mode === "user" && isAgentRole(normalizedRole);

  return [
    {
      id: "komunikasi",
      title: "Komunikasi",
      eyebrow: "Kebutuhan nomor",
      items: [
        { label: "Pulsa", href: path.pulsaData, iconKey: iconPath.pulsa },
        { label: "Paket Data", href: path.pulsaData, iconKey: iconPath.paketData },
        { label: "HP Pascabayar", href: path.hpPascabayar, iconKey: iconPath.hpPascabayar },
        { label: "eSIM & Roaming", href: mode === "user" ? userPath.esimRoaming : fallbackPath(mode, "esim-roaming"), iconKey: iconPath.esimRoaming },
      ],
    },
    {
      id: "keuangan",
      title: "Keuangan",
      eyebrow: "Saldo & pembayaran",
      items: [
        { label: "E-Wallet", href: path.ewallet, iconKey: iconPath.ewallet },
        { label: "Transfer Bank", href: path.transferBank, iconKey: iconPath.transferBank },
        { label: "Pembayaran QRIS", href: fallbackPath(mode, "qris"), iconKey: iconPath.qris },
        { label: "Uang Elektronik", href: fallbackPath(mode, "uang-elektronik"), iconKey: iconPath.uangElektronik },
        ...(canUseAgentCredit ? [{ label: "Kredit Saldo Agent", href: "/user/saldo/kredit-agent", iconKey: iconPath.cicilanMultifinance }] : []),
        { label: "Kartu Kredit", href: fallbackPath(mode, "kartu-kredit"), iconKey: iconPath.kartuKredit },
        { label: "Asuransi", href: fallbackPath(mode, "asuransi"), iconKey: iconPath.asuransi },
      ],
    },
    {
      id: "tagihan",
      title: "Tagihan",
      eyebrow: "Bayar rutin",
      items: [
        { label: "BPJS", href: path.bpjs, iconKey: iconPath.bpjs },
      ],
    },
    {
      id: "rumah",
      title: "Rumah Tangga",
      eyebrow: "Kebutuhan rumah",
      items: [
        { label: "Token PLN", href: path.tokenPln, iconKey: iconPath.tokenPln },
        { label: "PDAM", href: path.pdam, iconKey: iconPath.pdam },
        { label: "Gas PGN", href: path.pgn, iconKey: iconPath.gasPgn },
        { label: "Internet & WiFi", href: path.internet, iconKey: iconPath.internetWifi },
      ],
    },
    {
      id: "hiburan",
      title: "Hiburan",
      eyebrow: "Digital fun",
      items: [
        { label: "TV Kabel", href: path.tv, iconKey: iconPath.tvKabel },
        { label: "Voucher Game", href: path.game, iconKey: iconPath.voucherGame },
        { label: "Voucher Digital", href: fallbackPath(mode, "voucher-digital"), iconKey: iconPath.voucherDigital },
        { label: "Streaming & Musik", href: fallbackPath(mode, "streaming-musik"), iconKey: iconPath.streamingMusik },
      ],
    },
    {
      id: "kesehatan",
      title: "Kesehatan",
      eyebrow: "Layanan sehat",
      items: [
        { label: "Klinik & Kesehatan", href: fallbackPath(mode, "klinik-kesehatan"), iconKey: iconPath.klinikKesehatan },
      ],
    },
    {
      id: "pendidikan",
      title: "Pendidikan",
      eyebrow: "Biaya sekolah",
      items: [
        { label: "Uang Sekolah", href: fallbackPath(mode, "uang-sekolah"), iconKey: iconPath.uangSekolah },
      ],
    },
    {
      id: "cicilan",
      title: "Cicilan",
      eyebrow: "Bayar angsuran",
      items: [
        { label: "Cicilan Kendaraan", href: fallbackPath(mode, "cicilan-kendaraan"), iconKey: iconPath.cicilanKendaraan },
        { label: "Cicilan Multifinance", href: fallbackPath(mode, "cicilan-multifinance"), iconKey: iconPath.cicilanMultifinance },
      ],
    },
    {
      id: "pajak",
      title: "Pajak",
      eyebrow: "Kewajiban resmi",
      items: [
        { label: "PBB", href: fallbackPath(mode, "pbb"), iconKey: iconPath.pbb },
        { label: "Pajak & Negara", href: fallbackPath(mode, "pajak-negara"), iconKey: iconPath.pajakNegara },
      ],
    },
    {
      id: "perjalanan",
      title: "Perjalanan",
      eyebrow: "Mobilitas",
      items: [
        { label: "Tiket Perjalanan", href: fallbackPath(mode, "tiket-perjalanan"), iconKey: iconPath.tiketPerjalanan },
        { label: "Saldo Kartu Tol", href: fallbackPath(mode, "saldo-kartu-tol"), iconKey: iconPath.saldoKartuTol },
        { label: "Parkir Digital", href: fallbackPath(mode, "parkir-digital"), iconKey: iconPath.parkirDigital },
        { label: "Kurir & Pengiriman", href: fallbackPath(mode, "kurir-pengiriman"), iconKey: iconPath.kurirPengiriman },
      ],
    },
    {
      id: "sosial",
      title: "Sosial",
      eyebrow: "Berbagi",
      items: [
        { label: "Zakat & Donasi", href: fallbackPath(mode, "zakat-donasi"), iconKey: iconPath.zakatDonasi },
      ],
    },
  ];
}

export function ServiceDirectory({ mode = "guest", role }: ServiceDirectoryProps) {
  const groups = useMemo(() => getGroups(mode, role), [mode, role]);
  const [activeGroup, setActiveGroup] = useState("semua");
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = groups
    .filter((group) => activeGroup === "semua" || group.id === activeGroup)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(normalizedQuery)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section className="space-y-3 pb-24">
      <div className="sticky top-0 z-20 -mx-4 bg-[#EFFBFF]/92 px-4 pb-3 pt-3 backdrop-blur-xl">
        <label className="flex h-13 items-center gap-3 rounded-[22px] border border-sky-950/10 bg-white px-4 shadow-[0_12px_30px_rgba(22,138,242,0.08)]">
          <Search className="h-5 w-5 shrink-0 text-[#168AF2]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari pulsa, tagihan, voucher..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="-mx-4 mt-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            <button
              type="button"
              onClick={() => setActiveGroup("semua")}
              className={cn(
                "h-9 rounded-full px-4 text-xs font-black transition",
                activeGroup === "semua"
                  ? "bg-[#168AF2] text-white shadow-[0_10px_20px_rgba(215,7,23,0.22)]"
                  : "border border-sky-950/10 bg-white text-slate-600"
              )}
            >
              Semua
            </button>
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group.id)}
                className={cn(
                  "h-9 rounded-full px-4 text-xs font-black transition",
                  activeGroup === group.id
                    ? "bg-[#168AF2] text-white shadow-[0_10px_20px_rgba(215,7,23,0.22)]"
                    : "border border-sky-950/10 bg-white text-slate-600"
                )}
              >
                {group.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-cyan-200/70 bg-linear-to-r from-[#EFFBFF] via-white to-cyan-50 px-4 py-3 shadow-[0_12px_28px_rgba(22,138,242,0.08)]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-500">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-[#168AF2]">Transaksi makin praktis</p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Pilih layanan, isi data, lalu selesaikan pembayaran.</p>
          </div>
        </div>
      </div>

      {filteredGroups.length > 0 ? (
        filteredGroups.map((group) => (
          <div
            key={group.id}
            className="overflow-hidden rounded-[26px] border border-sky-950/[0.08] bg-white p-4 shadow-[0_14px_34px_rgba(22,138,242,0.08)]"
          >
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-[17px] font-black tracking-tight text-slate-950">{group.title}</h2>
              <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-black text-[#168AF2]">
                {group.items.length} layanan
              </span>
            </div>

            <div className="grid grid-cols-4 gap-x-2 gap-y-4">
              {group.items.map((item) => {
                return (
                  <Link
                    key={`${group.id}-${item.label}`}
                    href={item.href}
                    prefetch={false}
                    className="group flex min-h-[82px] flex-col items-center justify-start gap-1 text-center"
                  >
                    <DirectoryServiceIcon iconSrc={`/ruangsinyal-assets/icons-hd/${item.iconKey}`} label={item.label} />
                    <span className="line-clamp-2 max-w-[76px] text-[10px] font-black leading-tight text-slate-950">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-[26px] border border-dashed border-sky-200 bg-white p-8 text-center shadow-[0_14px_34px_rgba(22,138,242,0.08)]">
          <BookOpen className="mx-auto h-8 w-8 text-[#168AF2]" />
          <p className="mt-3 text-sm font-black text-slate-900">Layanan tidak ditemukan</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Coba kata kunci yang lebih singkat.</p>
        </div>
      )}

      <Link
        href={mode === "user" ? "/user" : "/"}
        prefetch={false}
        className="group flex items-center justify-between rounded-[24px] border border-sky-300/30 bg-[#168AF2] px-4 py-4 text-white shadow-[0_16px_34px_rgba(22,138,242,0.22)]"
      >
        <span>
          <span className="block text-sm font-black !text-white">Kembali ke beranda</span>
          <span className="mt-0.5 block text-xs font-semibold !text-sky-50">Lihat promo dan produk utama.</span>
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/70 bg-cyan-200 text-[#168AF2] shadow-[0_8px_18px_rgba(22,138,242,0.20)] transition group-hover:translate-x-0.5">
          <ChevronRight className="h-5 w-5" strokeWidth={2.6} />
        </span>
      </Link>
    </section>
  );
}
