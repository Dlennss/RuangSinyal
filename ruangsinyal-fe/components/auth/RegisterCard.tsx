"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, getSession, signIn } from "next-auth/react";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

const GOOGLE_LOGIN_ENABLED = String(process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED ?? "true").toLowerCase() === "true";

type RegisterResp = {
  ok?: boolean;
  member_id?: number;
  role?: string;
  auto_refund_claimed?: boolean;
  auto_refund_amount?: number;
  refund_invoice_id?: string;
  error?: string;
};

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function normalizeGoogleNext(raw: string, fallback = "/user") {
  let current = (raw || "").trim() || fallback;
  for (let i = 0; i < 6; i += 1) {
    try {
      const url = current.startsWith("http://") || current.startsWith("https://")
        ? new URL(current)
        : new URL(current, "https://ruangsinyal.local");
      if (url.pathname === "/login") {
        const nested = (url.searchParams.get("callbackUrl") || "").trim();
        if (nested) { current = nested; continue; }
      }
      if (url.pathname === "/auth/google/complete") {
        const nested = (url.searchParams.get("next") || "").trim();
        if (nested) { current = nested; continue; }
      }
      return `${url.pathname}${url.search}${url.hash}` || fallback;
    } catch {
      return current.startsWith("/") ? current : fallback;
    }
  }
  return current.startsWith("/") ? current : fallback;
}

function cleanPhoneInput(value: string) {
  return value.replace(/[^\d+]/g, "").slice(0, 16);
}

function normalizePhone(value: string) {
  const cleaned = cleanPhoneInput(value.trim());
  if (cleaned.startsWith("+62")) return `0${cleaned.slice(3)}`;
  if (cleaned.startsWith("62")) return `0${cleaned.slice(2)}`;
  return cleaned;
}

export function RegisterCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const refundContext = useMemo(() => ({
    invoiceId: (searchParams.get("refund_invoice_id") || "").trim(),
    guestEmail: (searchParams.get("guest_email") || "").trim(),
    guestPhone: (searchParams.get("guest_phone") || "").trim(),
  }), [searchParams]);
  const hasRefundContext = Boolean(refundContext.invoiceId && refundContext.guestEmail && refundContext.guestPhone);
  const loginCallbackUrl = useMemo(() => {
    return normalizeGoogleNext((searchParams.get("callbackUrl") || "").trim(), "/user");
  }, [searchParams]);
  const googleCallbackUrl = useMemo(() => {
    const params = new URLSearchParams({ next: loginCallbackUrl });
    if (hasRefundContext) {
      params.set("refund_invoice_id", refundContext.invoiceId);
      params.set("guest_email", refundContext.guestEmail);
      params.set("guest_phone", refundContext.guestPhone);
    }
    return `/auth/google/complete?${params.toString()}`;
  }, [hasRefundContext, loginCallbackUrl, refundContext.guestEmail, refundContext.guestPhone, refundContext.invoiceId]);
  const canUseGoogleLogin = GOOGLE_LOGIN_ENABLED && googleAvailable && !loading;

  useEffect(() => {
    if (!GOOGLE_LOGIN_ENABLED) return;
    void (async () => {
      const providers = await getProviders().catch(() => null);
      setGoogleAvailable(Boolean(providers?.google));
    })();
  }, []);

  async function claimRefundWithSession() {
    const sess = (await getSession().catch(() => null)) as { backendToken?: string } | null;
    const backendToken = String(sess?.backendToken || "").trim();
    if (!backendToken || !hasRefundContext) return false;
    const res = await fetch("/api/app/me/refunds/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${backendToken}` },
      body: JSON.stringify({
        invoice_id: refundContext.invoiceId,
        guest_email: refundContext.guestEmail,
        guest_phone: refundContext.guestPhone,
      }),
    });
    return res.ok;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const cleanNama = nama.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = normalizePhone(phone);
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();
    if (!cleanNama || !cleanEmail || !cleanPhone || !cleanPassword || !cleanConfirm) { setErr("Lengkapi nama, email, nomor telepon, dan password."); return; }
    if (!/^08\d{8,12}$/.test(cleanPhone)) { setErr("Nomor telepon gunakan format 08 dan 10-14 digit."); return; }
    if (cleanPassword.length < 8) { setErr("Password minimal 8 karakter."); return; }
    if (cleanPassword !== cleanConfirm) { setErr("Konfirmasi password tidak sama."); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: cleanNama, email: cleanEmail, phone: cleanPhone, password: cleanPassword,
          refund_invoice_id: refundContext.invoiceId,
          guest_email: refundContext.guestEmail,
          guest_phone: refundContext.guestPhone,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as RegisterResp;
      if (!r.ok || !j?.ok) { setErr(j?.error || "Registrasi gagal"); return; }
      if (hasRefundContext) {
        const loginResult = await signIn("credentials", { redirect: false, email: cleanEmail, password: cleanPassword });
        if (!loginResult || loginResult.error) { router.replace(`/login?registered=1`); return; }
        const refundClaimed = j?.auto_refund_claimed || (await claimRefundWithSession());
        router.replace(refundClaimed ? "/user?registered=1&refund=1" : "/user?registered=1");
        return;
      }
      router.replace(`/login?registered=1`);
    } finally {
      setLoading(false);
    }
  }

  if (err && !shake) setTimeout(() => setShake(true), 0);
  if (!err && shake) setTimeout(() => setShake(false), 0);

  const fieldClass = "flex min-h-[64px] items-center gap-3 rounded-[18px] border border-sky-100 bg-white px-4 shadow-[0_8px_20px_rgba(15,23,42,0.035)] transition focus-within:border-[#168AF2] focus-within:ring-4 focus-within:ring-sky-100";
  const fieldIconClass = "grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-sky-50 text-[#168AF2]";
  const inputClass = "mt-1 h-7 w-full min-w-0 bg-transparent text-base font-bold text-slate-900 outline-none placeholder:text-sm placeholder:font-semibold placeholder:text-slate-400";
  const toggleBtn = "absolute right-5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:text-[#168AF2]";

  return (
    <section className={cn("min-h-svh bg-[#EFFBFF] text-slate-950 sm:min-h-[820px]", shake && "auth-shake")}>
      <div className="relative mx-auto min-h-svh w-full max-w-md overflow-hidden bg-[#EFFBFF]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[330px] bg-[linear-gradient(180deg,#c8f4ff_0%,#EFFBFF_88%)]" />
        <div className="relative h-[218px] overflow-hidden rounded-b-[30px] bg-[#168AF2] text-white shadow-[0_16px_38px_rgba(22,138,242,0.18)]">
          <Image
            src="/ruangsinyal-assets/header_tower_strip.png"
            alt=""
            fill
            priority
            sizes="430px"
            className="object-fill"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(14,135,222,0.08)_52%,rgba(239,251,255,0.35)_100%)]" />
          <div className="relative flex h-full flex-col justify-between px-5 pb-12 pt-5">
            <Link href="/" className="inline-flex h-12 w-fit max-w-[72vw] items-center rounded-[16px] bg-white/96 px-3 shadow-[0_10px_24px_rgba(6,43,116,0.12)] ring-1 ring-white/70">
              <Image
                src="/images/logo-ruangsinyal-header.png"
                alt="RuangSinyal"
                width={210}
                height={48}
                className="h-8 w-auto max-w-full object-contain"
                priority
              />
            </Link>

            <div className="max-w-[270px]">
              <h1 className="text-[27px] font-black leading-none tracking-normal text-white drop-shadow-[0_3px_10px_rgba(6,43,116,0.18)]">Tambah Akun</h1>
              <p className="mt-2 text-sm font-semibold leading-5 text-white/88">Buat akun RuangSinyal untuk mulai transaksi lebih mudah.</p>
            </div>
          </div>
        </div>

      <div className="relative -mt-9 px-4 pb-8 sm:px-5">
        <div className="rounded-[24px] bg-white px-5 py-5 shadow-[0_18px_44px_rgba(22,138,242,0.14)] ring-1 ring-sky-950/[0.06]">
        {err && (
          <div className="mb-4 flex items-start gap-2.5 rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-3">
            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#168AF2]" />
            <p className="text-[13px] font-medium text-sky-700">{err}</p>
          </div>
        )}

        {hasRefundContext && (
          <div className="mb-4 flex items-start gap-2.5 rounded-[18px] border border-cyan-200 bg-cyan-50 px-4 py-3">
            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            <p className="text-[13px] font-medium text-cyan-800">
              Transaksi gagal dengan invoice <span className="font-bold">{refundContext.invoiceId}</span>. Daftar agar saldo tidak hilang.
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="sr-only">Nama Lengkap</label>
            <div className={fieldClass}>
              <span className={fieldIconClass}>
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-black leading-none text-slate-900">Nama Lengkap</span>
                <input className={inputClass} value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Masukkan nama lengkap" autoComplete="name" />
              </div>
            </div>
          </div>

          <div>
            <label className="sr-only">Email</label>
            <div className={fieldClass}>
              <span className={fieldIconClass}>
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-black leading-none text-slate-900">Email</span>
                <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Masukkan email aktif" autoComplete="email" type="email" />
              </div>
            </div>
          </div>

          <div>
            <label className="sr-only">Nomor Telepon</label>
            <div className={fieldClass}>
              <span className={fieldIconClass}>
                <Phone className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-black leading-none text-slate-900">Nomor Telepon</span>
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
                  placeholder="Contoh: 08xxxxxxxxxx"
                  autoComplete="tel"
                  inputMode="tel"
                  type="tel"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="sr-only">Password</label>
            <div className={`relative pr-12 ${fieldClass}`}>
              <span className={fieldIconClass}>
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-black leading-none text-slate-900">Password</span>
                <input className={inputClass} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Buat password" autoComplete="new-password" />
              </div>
              <button type="button" onClick={() => setShowPassword((v) => !v)} className={toggleBtn} tabIndex={-1}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="sr-only">Konfirmasi Password</label>
            <div className={`relative pr-12 ${fieldClass}`}>
              <span className={fieldIconClass}>
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-black leading-none text-slate-900">Konfirmasi Password</span>
                <input className={inputClass} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" autoComplete="new-password" />
              </div>
              <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className={toggleBtn} tabIndex={-1}>
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            className="group relative mt-1 flex h-[54px] w-full items-center justify-center gap-3 rounded-[18px] bg-linear-to-r from-[#168AF2] via-[#2AA8F4] to-[#21D5ED] text-base font-black text-white shadow-[0_14px_30px_rgba(22,138,242,0.24)] transition-all hover:brightness-105 hover:shadow-[0_18px_38px_rgba(22,138,242,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Daftar</span>
            )}
          </button>

          {GOOGLE_LOGIN_ENABLED && (
            <>
              <div className="flex items-center gap-4 pt-1">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-sm font-semibold text-slate-400">atau</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <button
                type="button"
                className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[18px] border-2 border-[#168AF2] bg-white text-sm font-black text-[#168AF2] shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-all hover:bg-sky-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canUseGoogleLogin}
                onClick={() => {
                  if (!canUseGoogleLogin) {
                    setErr("Login Google belum dikonfigurasi. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET.");
                    return;
                  }
                  void signIn("google", { callbackUrl: googleCallbackUrl });
                }}
              >
                <Image src="/google.svg" alt="" width={24} height={24} aria-hidden="true" />
                {googleAvailable ? "Masuk dengan Google" : "Google belum dikonfigurasi"}
              </button>
            </>
          )}

          <div className="flex items-center gap-3 pt-1">
            <div className="h-px flex-1 bg-slate-200" />
            <p className="shrink-0 text-center text-sm font-semibold text-slate-500">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-black text-[#168AF2] hover:underline">
                Masuk
              </Link>
            </p>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </form>
        </div>

        <p className="flex items-center justify-center gap-2 px-8 pt-6 text-center text-sm font-semibold leading-6 text-slate-500">
          <ShieldCheck className="h-5 w-5 shrink-0 fill-slate-500/15 text-slate-500" />
          <span>Data Anda aman dan terlindungi</span>
        </p>
      </div>
      </div>
    </section>
  );
}
