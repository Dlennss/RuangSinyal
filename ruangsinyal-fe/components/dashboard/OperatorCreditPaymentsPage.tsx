"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Eye, FileCheck2, ImageIcon, ReceiptText, Search, UsersRound, X } from "lucide-react";
import type { AgentCreditApplication, AgentCreditPayment } from "@/lib/api.auth";

type PaymentRow = AgentCreditPayment & {
  agentName: string;
  agentEmail: string;
  creditID: string;
};

function formatIDR(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Number(value || 0))}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function proofSource(payment: AgentCreditPayment) {
  const source = payment.payment_proof?.data_url;
  return typeof source === "string" && source.startsWith("data:image/") ? source : "";
}

function methodLabel(method?: string) {
  if (method === "qris") return "QRIS";
  return "Transfer Bank";
}

export function OperatorCreditPaymentsPage({ applications }: { applications: AgentCreditApplication[] }) {
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<PaymentRow | null>(null);

  const rows = useMemo<PaymentRow[]>(() => applications.flatMap((application) => {
    const applicantName = application.applicant_data?.nama_lengkap;
    const agentName = application.agent_name || application.member_name || (typeof applicantName === "string" ? applicantName : "") || "Agent RuangSinyal";
    const agentEmail = application.agent_email || application.member_email || "-";
    const creditID = `KRD-${String(application.id).padStart(8, "0")}`;
    return (application.payments || []).map((payment) => ({ ...payment, agentName, agentEmail, creditID }));
  }).sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()), [applications]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => [row.creditID, row.agentName, row.agentEmail, row.payment_method, row.note, String(row.amount)]
      .some((value) => String(value || "").toLowerCase().includes(keyword)));
  }, [query, rows]);

  const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const agentCount = new Set(rows.map((row) => row.member_id)).size;
  const proofCount = rows.filter((row) => Boolean(proofSource(row))).length;

  return (
    <main className="min-h-screen bg-[#EFFBFF] p-3 text-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
        <header className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_88%_8%,rgba(255,196,0,0.36),transparent_30%),linear-gradient(135deg,#168AF2_0%,#168AF2_54%,#21D5ED_118%)] text-white shadow-[0_18px_42px_rgba(22,138,242,0.22)]">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#168AF2] shadow-[0_12px_24px_rgba(0,0,0,0.12)]"><ReceiptText className="h-6 w-6" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">Operator Kredit</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Pembayaran Kredit</h1><p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-white/82 sm:text-sm">Pantau pelunasan sebagian agent dan periksa bukti pembayaran yang tersimpan.</p></div></div>
            <div className="rounded-2xl bg-white px-5 py-3 text-[#168AF2] shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Rekap Setoran</p>
              <p className="mt-1 text-lg font-black">{formatIDR(totalAmount)}</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Total Pembayaran", value: String(rows.length), hint: formatIDR(totalAmount), icon: ReceiptText },
            { label: "Agent Membayar", value: String(agentCount), hint: "Agent tercatat", icon: UsersRound },
            { label: "Bukti Tersimpan", value: String(proofCount), hint: `${rows.length - proofCount} tanpa bukti`, icon: FileCheck2 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex min-h-28 items-center justify-between rounded-[22px] border border-sky-950/[0.06] bg-white p-4 shadow-[0_14px_34px_rgba(22,138,242,0.06)]">
                <div><p className="text-[10px] font-black uppercase text-[#168AF2]">{item.label}</p><p className="mt-2 text-2xl font-black">{item.value}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.hint}</p></div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-[#168AF2]"><Icon className="h-6 w-6" /></span>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-[28px] border border-sky-950/[0.06] bg-white shadow-[0_18px_44px_rgba(22,138,242,0.07)]">
          <div className="flex flex-col gap-3 border-b border-sky-950/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-black">Riwayat Pembayaran</h2><p className="mt-1 text-[11px] font-semibold text-slate-500">Urutan terbaru ditampilkan paling atas.</p></div>
            <label className="flex h-11 w-full items-center gap-2 rounded-2xl border border-sky-950/[0.06] bg-[#F4FCFF] px-3 sm:max-w-md">
              <Search className="h-4 w-4 shrink-0 text-[#168AF2]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari ID kredit, agent, email, atau nominal" className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none" />
            </label>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="bg-sky-50 text-[10px] font-black uppercase text-sky-900"><tr><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Agent</th><th className="px-4 py-3">Nominal</th><th className="px-4 py-3">Metode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Bukti</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => {
                  const source = proofSource(row);
                  return <tr key={row.id} className="hover:bg-sky-50/40"><td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-500">{formatDateTime(row.paid_at)}</td><td className="px-4 py-4"><p className="font-black">{row.agentName}</p><p className="mt-1 text-[10px] font-black text-[#168AF2]">{row.creditID}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{row.agentEmail}</p></td><td className="px-4 py-4 font-black text-[#168AF2]">{formatIDR(row.amount)}</td><td className="px-4 py-4 font-bold">{methodLabel(row.payment_method)}</td><td className="px-4 py-4"><span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black text-[#168AF2]">Dicairkan kembali</span></td><td className="px-4 py-4 text-right">{source ? <button type="button" onClick={() => setPreview(row)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#168AF2] px-3 font-black text-white"><Eye className="h-4 w-4" />Lihat</button> : <span className="text-[10px] font-bold text-slate-400">Tidak ada</span>}</td></tr>;
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {filteredRows.map((row) => {
              const source = proofSource(row);
              return <article key={row.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black">{row.agentName}</p><p className="mt-1 truncate text-[10px] font-black text-[#168AF2]">{row.creditID}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-400">{row.agentEmail}</p></div><span className="shrink-0 text-sm font-black text-[#168AF2]">{formatIDR(row.amount)}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-xl bg-slate-50 p-2"><p className="font-semibold text-slate-400">Waktu</p><p className="mt-1 font-black">{formatDateTime(row.paid_at)}</p></div><div className="rounded-xl bg-slate-50 p-2"><p className="font-semibold text-slate-400">Metode</p><p className="mt-1 font-black">{methodLabel(row.payment_method)}</p></div></div>{source ? <button type="button" onClick={() => setPreview(row)} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#168AF2] text-xs font-black text-white"><Eye className="h-4 w-4" />Lihat Bukti</button> : <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-center text-[10px] font-bold text-slate-400">Bukti tidak tersedia</p>}</article>;
            })}
          </div>

          {!filteredRows.length ? <div className="grid min-h-56 place-items-center px-4 py-10 text-center"><div><ImageIcon className="mx-auto h-9 w-9 text-sky-300" /><p className="mt-3 text-sm font-black">Belum ada pembayaran kredit</p><p className="mt-1 text-xs font-semibold text-slate-400">Pembayaran agent akan otomatis muncul di sini.</p></div></div> : null}
        </section>
      </div>

      {preview && proofSource(preview) ? createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black">Bukti Pembayaran</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{preview.agentName} - {formatIDR(preview.amount)}</p></div><button type="button" onClick={() => setPreview(null)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100" aria-label="Tutup"><X className="h-5 w-5" /></button></div>
            {/* Bukti berasal dari unggahan agent dan perlu mempertahankan ukuran aslinya. */}
            <img src={proofSource(preview)} alt={`Bukti pembayaran ${preview.agentName}`} className="mt-4 max-h-[65dvh] w-full rounded-2xl bg-slate-100 object-contain" />
            <a href={proofSource(preview)} download={preview.payment_proof?.name || `bukti-pembayaran-${preview.id}.png`} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#168AF2] text-xs font-black text-white"><Download className="h-4 w-4" />Unduh Bukti</a>
          </div>
        </div>, document.body) : null}
    </main>
  );
}

