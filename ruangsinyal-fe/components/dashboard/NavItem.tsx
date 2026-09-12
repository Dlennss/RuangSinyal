"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowUpCircle,
  BarChart3,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  Image,
  Landmark,
  LayoutDashboard,
  Package,
  PlugZap,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Tags,
  UserPlus,
  Users,
  Wallet,
  WalletCards,
  XCircle,
} from "lucide-react";

type Props = {
  href: string;
  label: string;
  onClick?: () => void;
  variant?: "light" | "dark";
};

const iconByHref = {
  "/dashboard/admin": LayoutDashboard,
  "/dashboard/admin/komisi": BarChart3,
  "/dashboard/admin/master/members": Users,
  "/dashboard/admin/pemantauan-tim": Activity,
  "/dashboard/admin/kredit/pengajuan": CreditCard,
  "/dashboard/admin/transaksi/aplikasi": ReceiptText,
  "/dashboard/admin/transaksi/aplikasi/provider": PlugZap,
  "/dashboard/admin/transaksi/guest-refund": RefreshCcw,
  "/dashboard/admin/deposits": CircleDollarSign,
  "/dashboard/admin/retail-withdraws": Download,
  "/dashboard/admin/bank": Landmark,
  "/dashboard/admin/master/produk": Package,
  "/dashboard/admin/master/fee-kategori-aplikasi": Tags,
  "/dashboard/admin/master/iklan": Image,
  "/dashboard/admin/integrasi/pulsa24jam": PlugZap,
  "/dashboard/operator": Activity,
  "/dashboard/wallet": WalletCards,
  "/dashboard/auditor": ShieldCheck,
  "/dashboard/master": LayoutDashboard,
  "/dashboard/master/tambah-agent": UserPlus,
  "/dashboard/master/input-pinjaman-manual": FileText,
  "/dashboard/master/pinjaman": Camera,
  "/dashboard/master/akun-agent": Users,
  "/dashboard/master/profil-agent": Activity,
  "/dashboard/master/riwayat-pinjaman": ReceiptText,
  "/dashboard/master/laporan": FileCheck2,
  "/dashboard/master/analis": ShieldCheck,
  "/dashboard/master/analis/antrean": ClipboardList,
  "/dashboard/master/analis/monitor-pelunasan": WalletCards,
  "/dashboard/master/analis/bukti-pelunasan": FileCheck2,
  "/dashboard/master/analis/penolakan-catatan": XCircle,
  "/dashboard/master/analis/arsip-keputusan": Archive,
  "/dashboard/master/operator": ShieldCheck,
  "/dashboard/master/operator/tambah-marketing": UserPlus,
  "/dashboard/master/operator/input-data-agent": FilePlus2,
  "/dashboard/master/operator/kenaikan-limit": ArrowUpCircle,
  "/dashboard/master/operator/pembayaran-kredit": ReceiptText,
  "/dashboard/master/operator/monitor-pelunasan": WalletCards,
  "/dashboard/master/operator/transaksi-agent": ReceiptText,
  "/dashboard/master/operator/konter-tidak-transaksi": AlertTriangle,
  "/dashboard/master/operator/arsip-keputusan": Archive,
  "/dashboard/master/riwayat-acc-analis": FileText,
} as const;

export function NavItem({ href, label, onClick, variant = "light" }: Props) {
  const pathname = usePathname();
  const hrefPath = href.split("?")[0] || href;
  const Icon = iconByHref[hrefPath as keyof typeof iconByHref];
  const exactOnlyHrefs = new Set([
    "/dashboard/admin",
    "/dashboard/admin/komisi",
    "/dashboard/admin/transaksi/aplikasi",
    "/dashboard/member",
    "/dashboard/operator",
    "/dashboard/wallet",
    "/dashboard/master",
    "/dashboard/master/operator",
  ]);
  const active = exactOnlyHrefs.has(hrefPath) ? pathname === hrefPath : pathname === hrefPath || pathname.startsWith(hrefPath + "/");
  const isDark = variant === "dark";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "group flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-[13px] font-semibold tracking-normal outline-none transition focus-visible:ring-4 focus-visible:ring-sky-200",
        active
          ? isDark
            ? "border-white bg-white !text-[#168AF2] shadow-[0_14px_28px_rgba(0,0,0,0.16)]"
            : "border-[#168AF2] bg-white text-[#168AF2] shadow-[0_4px_12px_rgba(8,100,160,0.20)]"
          : isDark
            ? "border-white/15 bg-white/10 !text-sky-50 hover:border-cyan-200/60 hover:bg-white/20 hover:!text-white"
            : "border-white/70 bg-white/50 text-slate-800 shadow-[0_2px_6px_rgba(8,76,120,0.08)] hover:border-sky-200 hover:bg-white hover:text-slate-950 hover:shadow-[0_4px_10px_rgba(8,76,120,0.14)]",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <span className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <span
            className={[
              "grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition",
              active
                ? isDark
                  ? "border-sky-100 bg-sky-50 text-[#168AF2]"
                  : "border-sky-200 bg-sky-50 text-[#168AF2]"
                : isDark
                  ? "border-cyan-200/25 bg-sky-950/25 text-cyan-100 group-hover:border-cyan-100/55 group-hover:bg-sky-900/30"
                  : "border-sky-100 bg-white text-[#168AF2] shadow-[0_2px_5px_rgba(8,76,120,0.10)]",
            ].join(" ")}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2.4} />
          </span>
        ) : null}
        <span className={`min-w-0 break-words leading-5 ${isDark && !active ? "!text-sky-50" : ""}`}>{label}</span>
      </span>
      {active ? (
        <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-[#168AF2] text-white" : "bg-[#168AF2] text-white"}`}>
          <CheckCircle2 className="h-4 w-4" />
        </span>
      ) : null}
    </Link>
  );
}
