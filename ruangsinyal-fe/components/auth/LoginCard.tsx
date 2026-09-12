"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import TurnstileWidget from "@/components/TurnstileWidget";
import { decodeJwt } from "@/lib/jwt";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const TURNSTILE_ENABLED = /^(1|true|yes|on)$/i.test(process.env.NEXT_PUBLIC_TURNSTILE_ENABLED || "");
// Ketersediaan akhir tetap ditentukan provider dari server (`getProviders`).
// Default aktif mencegah build lama mengunci tombol ketika konfigurasi server baru dipasang.
const GOOGLE_LOGIN_ENABLED = String(process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED ?? "true").toLowerCase() === "true";

type PasswordLoginResp = { ok?: boolean; token?: string; role?: string; error?: string };

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

async function persistLoginToken(token: string) {
  const response = await fetch("/api/auth/persist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
    cache: "no-store",
  }).catch(() => null);

  return Boolean(response?.ok);
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

function toDashboardByRole(role?: string | null) {
  const r = (role || "").toLowerCase();
  if (r === "admin" || r === "staff") return "/dashboard/admin";
  if (r === "auditor") return "/dashboard/auditor";
  if (r === "analis" || r === "analyst") return "/dashboard/master/operator";
  if (r === "master") return "/dashboard/master";
  if (r === "user" || r === "agent") return "/user";
  if (r === "operator_trx") return "/dashboard/operator";
  if (r === "operator_wallet") return "/dashboard/wallet";
  return "/dashboard/member";
}

export function LoginCard() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [shake, setShake] = useState(false);
  const loginCallbackUrl = normalizeGoogleNext((searchParams.get("callbackUrl") || "").trim(), "/user");
  const googleCallbackUrl = `/auth/google/complete?${new URLSearchParams({ next: loginCallbackUrl }).toString()}`;
  const canUseGoogleLogin = GOOGLE_LOGIN_ENABLED && googleAvailable && !loading;

  useEffect(() => {
    setTurnstileToken(TURNSTILE_ENABLED ? "" : "dev-bypass");
  }, []);

  useEffect(() => {
    if (!GOOGLE_LOGIN_ENABLED) return;
    void (async () => {
      const providers = await getProviders().catch(() => null);
      setGoogleAvailable(Boolean(providers?.google));
    })();
  }, []);

  useEffect(() => {
    if (!err) return;
    setShake(true);
    const t = setTimeout(() => setShake(false), 520);
    return () => clearTimeout(t);
  }, [err]);

  useEffect(() => {
    const googleStatus = (searchParams.get("google") || "").trim();
    const authError = (searchParams.get("error") || "").trim();
    if (googleStatus === "not_configured") {
      setErr("Login Google belum tersambung. Isi Client ID dan Client Secret Google terlebih dulu.");
      return;
    }
    if (authError) {
      setErr("Login Google gagal atau dibatalkan. Coba masuk ulang.");
    }
  }, [searchParams]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setErr("Selesaikan verifikasi keamanan.");
      return;
    }
    setLoading(true);
    try {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, turnstileToken }),
        cache: "no-store",
      });
      const loginBody = (await loginResponse.json().catch(() => ({}))) as PasswordLoginResp;
      const backendToken = String(loginBody.token || "").trim();
      if (!loginResponse.ok || !loginBody.ok || !backendToken) {
        setErr("Email atau password salah.");
        return;
      }

      if (!(await persistLoginToken(backendToken))) {
        setErr("Sesi login belum tersimpan. Silakan coba lagi.");
        return;
      }

      localStorage.setItem("auth_token", backendToken);
      localStorage.setItem("auth_source", "password");

      // `/api/auth/login` sudah membuat cookie HttpOnly dan mengembalikan token
      // backend. Jangan jalankan login NextAuth kedua karena dua perubahan sesi
      // bersamaan memicu kedipan/navigasi ganda terutama di Safari mobile.
      window.location.replace(toDashboardByRole(loginBody.role || decodeJwt(backendToken)?.role || "member"));
    } catch {
      setErr("Koneksi login gagal. Periksa jaringan lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={cn("min-h-svh bg-[#EFFBFF] text-slate-950 sm:min-h-[820px]", shake && "auth-shake")}>
      <div className="relative mx-auto min-h-svh w-full max-w-md overflow-hidden bg-[#EFFBFF]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[330px] bg-[linear-gradient(180deg,#c8f4ff_0%,#EFFBFF_88%)]" />
        <div className="relative h-[238px] overflow-hidden rounded-b-[30px] bg-[#168AF2] text-white shadow-[0_16px_38px_rgba(22,138,242,0.18)]">
        <Image
          src="/ruangsinyal-assets/header_tower_strip.png"
          alt=""
          fill
          priority
          sizes="430px"
          className="object-fill"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(14,135,222,0.08)_52%,rgba(239,251,255,0.35)_100%)]" />
        <div className="relative flex h-full flex-col justify-between px-5 pb-14 pt-5">
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

          <div className="max-w-[250px]">
            <h1 className="text-[28px] font-black leading-none tracking-normal text-white drop-shadow-[0_3px_10px_rgba(6,43,116,0.18)]">Masuk Akun</h1>
            <p className="mt-2 text-sm font-semibold leading-5 text-white/88">Kelola transaksi RuangSinyal dengan cepat dan aman.</p>
          </div>
        </div>
      </div>

      <div className="relative -mt-10 px-4 pb-8 sm:px-5">
        <div className="rounded-[24px] bg-white px-5 py-5 shadow-[0_18px_44px_rgba(22,138,242,0.14)] ring-1 ring-sky-950/[0.06]">

        {err && (
          <div className="mb-4 flex items-start gap-2.5 rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-3">
            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#168AF2]" />
            <p className="text-[13px] font-medium text-sky-700">{err}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="sr-only">Email</label>
            <div className="flex min-h-[66px] items-center gap-3 rounded-[18px] border border-sky-100 bg-white px-4 shadow-[0_8px_20px_rgba(15,23,42,0.035)] transition focus-within:border-[#168AF2] focus-within:ring-4 focus-within:ring-sky-100">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-sky-50 text-[#168AF2]">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-black leading-none text-slate-900">Email</span>
                <input
                  className="mt-1 h-7 w-full min-w-0 bg-transparent text-base font-bold text-slate-900 outline-none placeholder:text-sm placeholder:font-semibold placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  autoComplete="username"
                  type="email"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="sr-only">PIN / Password</label>
            <div className="relative flex min-h-[66px] items-center gap-3 rounded-[18px] border border-sky-100 bg-white px-4 shadow-[0_8px_20px_rgba(15,23,42,0.035)] transition focus-within:border-[#168AF2] focus-within:ring-4 focus-within:ring-sky-100">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-sky-50 text-[#168AF2]">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 pr-9">
                <span className="block text-xs font-black leading-none text-slate-900">PIN / Password</span>
                <input
                  className="mt-1 h-7 w-full min-w-0 bg-transparent text-base font-bold text-slate-900 outline-none placeholder:text-sm placeholder:font-semibold placeholder:text-slate-400"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan PIN atau password"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 px-0.5 pt-0.5">
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 accent-[#168AF2]"
              />
              Ingat saya
            </label>
            <Link href="#" className="text-sm font-black text-[#168AF2] hover:underline">
              Lupa PIN?
            </Link>
          </div>

          {/* Turnstile - interaction-only, tidak tampil kalau sudah verified */}
          {TURNSTILE_ENABLED && !turnstileToken && (
            <div className="overflow-hidden rounded-xl">
              <TurnstileWidget
                siteKey={SITE_KEY}
                onToken={setTurnstileToken}
                onExpire={() => setTurnstileToken("")}
                onError={() => setTurnstileToken("")}
                appearance="interaction-only"
              />
            </div>
          )}

          {/* Login Button */}
          <button
            className="group relative flex h-[54px] w-full items-center justify-center gap-3 rounded-[18px] bg-linear-to-r from-[#168AF2] via-[#2AA8F4] to-[#21D5ED] text-base font-black text-white shadow-[0_14px_30px_rgba(22,138,242,0.24)] transition-all hover:brightness-105 hover:shadow-[0_18px_38px_rgba(22,138,242,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            disabled={(TURNSTILE_ENABLED && !turnstileToken) || loading}
            type="submit"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>

          <Link
            href="/register"
            className="flex h-[52px] w-full items-center justify-center rounded-[18px] border-2 border-[#168AF2] bg-white text-base font-black text-[#168AF2] transition hover:bg-sky-50 active:scale-[0.98]"
          >
            Daftar Akun Baru
          </Link>

          <div className="flex items-center gap-4 pt-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm font-semibold text-slate-400">atau</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[18px] border border-sky-100 bg-white text-sm font-black text-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-all hover:border-sky-200 hover:bg-sky-50/50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canUseGoogleLogin}
            onClick={() => {
              if (!canUseGoogleLogin) {
                setErr(GOOGLE_LOGIN_ENABLED ? "Login Google belum dikonfigurasi." : "Login Google belum aktif.");
                return;
              }
              void signIn("google", { callbackUrl: googleCallbackUrl });
            }}
          >
            <Image src="/google.svg" alt="" width={22} height={22} aria-hidden="true" />
            {googleAvailable ? "Masuk dengan Google" : "Google belum dikonfigurasi"}
          </button>
        </form>

        </div>

        <p className="px-8 pt-7 text-center text-sm font-semibold leading-6 text-slate-500">
          Dengan masuk, Anda menyetujui{" "}
          <Link href="/privacy-policy" className="font-black text-[#168AF2]">
            Syarat & Ketentuan
          </Link>
        </p>
      </div>
      </div>
    </section>
  );
}
