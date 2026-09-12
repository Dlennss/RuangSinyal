import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Clock3, ReceiptText, RotateCcw, XCircle } from "lucide-react";
import { getAppServerSession } from "@/lib/server-auth";
import { getUserOrders } from "@/lib/api.transactions";
import type { UserAppOrder, UserSession } from "@/components/user/types";
import { UserBottomNav } from "@/components/user/UserBottomNav";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

const statusLabel: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  paid: "Pembayaran Diterima",
  processing_provider: "Sedang Diproses",
  success: "Transaksi Berhasil",
  failed: "Transaksi Gagal",
  expired: "Pembayaran Kedaluwarsa",
  cancelled: "Transaksi Dibatalkan",
  refunded: "Dana Dikembalikan",
};

function formatIDR(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNotificationTone(status: string) {
  if (status === "success") return { icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-600" };
  if (status === "failed" || status === "cancelled" || status === "expired") return { icon: XCircle, bg: "bg-sky-50", text: "text-[#168AF2]" };
  if (status === "refunded") return { icon: RotateCcw, bg: "bg-cyan-50", text: "text-cyan-600" };
  return { icon: Clock3, bg: "bg-sky-50", text: "text-sky-600" };
}

function NotificationItem({ item }: { item: UserAppOrder }) {
  const tone = getNotificationTone(item.status);
  const Icon = tone.icon;
  const title = statusLabel[item.status] || "Update Transaksi";
  const amount = Number(item.harga_final || item.nominal || 0);

  return (
    <Link
      href={`/user/transaksi/${encodeURIComponent(item.invoice_id)}`}
      prefetch={false}
      className="flex items-center gap-3 rounded-[20px] bg-white p-3 shadow-[0_12px_28px_rgba(22,138,242,0.08)] ring-1 ring-sky-950/[0.06]"
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone.bg} ${tone.text}`}>
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black leading-4 text-slate-950">{title}</span>
        <span className="mt-1 block truncate text-[11px] font-semibold leading-4 text-slate-500">
          {item.produk_nama_snapshot || "Transaksi RuangSinyal"} â€¢ {formatIDR(amount)}
        </span>
        <span className="mt-0.5 block text-[10px] font-bold text-slate-400">{formatDate(item.dibuat_pada)}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2.5} />
    </Link>
  );
}

function EmptyNotifications() {
  return (
    <section className="rounded-[24px] bg-white p-5 text-center shadow-[0_16px_36px_rgba(22,138,242,0.08)] ring-1 ring-sky-950/[0.06]">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-sky-50 text-[#168AF2]">
        <ReceiptText className="h-7 w-7" strokeWidth={2.4} />
      </span>
      <h2 className="mt-3 text-base font-black text-slate-950">Belum ada notifikasi</h2>
      <p className="mx-auto mt-1 max-w-[260px] text-xs font-semibold leading-5 text-slate-500">
        Aktivitas transaksi, saldo, password, dan keamanan akun akan muncul otomatis di sini.
      </p>
      <Link
        href="/user/kategori"
        prefetch={false}
        className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#168AF2,#21D5ED)] px-5 text-xs font-black text-white shadow-[0_12px_24px_rgba(22,138,242,0.18)]"
      >
        Pilih Layanan
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} />
      </Link>
    </section>
  );
}

export default async function UserNotificationPage() {
  const session = (await getAppServerSession()) as SessionShape | null;
  if (!session?.backendToken) {
    redirect("/login");
  }

  const fetchedItems = await getUserOrders(session.backendToken, undefined, 12, 0);
  const items = ((fetchedItems as UserAppOrder[]) || []).slice(0, 12);

  return (
    <main className="min-h-screen bg-[#EFFBFF] px-4 pb-28 pt-5">
      <div className="mx-auto w-full max-w-md">
        {items.length > 0 ? (
          <section className="space-y-2.5">
            {items.map((item) => (
              <NotificationItem key={item.id || item.invoice_id} item={item} />
            ))}
          </section>
        ) : (
          <EmptyNotifications />
        )}
      </div>
      <UserBottomNav />
    </main>
  );
}
