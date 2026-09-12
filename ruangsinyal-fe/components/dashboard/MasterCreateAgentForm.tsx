"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Copy,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  Store,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type CreateResp = {
  ok?: boolean;
  error?: string;
  member_id?: number;
};

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("auth_token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function makePassword() {
  const seed = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `Ruang${seed}24`;
}

function Field({
  label,
  icon: Icon,
  children,
  helper,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
  helper?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
        <Icon className="h-4 w-4 shrink-0 text-[#168AF2]" strokeWidth={2.2} />
        {label}
      </span>
      {children}
      {helper ? <span className="mt-2 block text-[11px] font-medium leading-[1.45] text-slate-500">{helper}</span> : null}
    </label>
  );
}

export function MasterCreateAgentForm({ useRetailEndpoint = false }: { useRetailEndpoint?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [password, setPassword] = useState(makePassword);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canSubmit = email.trim() && name.trim() && password.trim().length >= 8 && !loading;

  async function copyPassword() {
    await navigator.clipboard?.writeText(password).catch(() => undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setMessage({ type: "error", text: "Nama, email, dan password minimal 8 karakter wajib diisi." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(useRetailEndpoint ? "/api/me/retail/downlines" : "/api/admin/members/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          email: email.trim(),
          nama: name.trim(),
          phone: phone.trim(),
          store_name: storeName.trim(),
          password: password.trim(),
          role: "agent",
          retail_agent_commission_rp: 0,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as CreateResp;
      if (!response.ok || !body.ok || !body.member_id) {
        throw new Error(body.error || "Akun agent gagal dibuat");
      }

      setMessage({ type: "success", text: `Agent berhasil dibuat. ID Agent: ${body.member_id}` });
      setEmail("");
      setName("");
      setPhone("");
      setStoreName("");
      setPassword(makePassword());
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Akun agent gagal dibuat" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full min-w-0">
      <section className="w-full min-w-0 overflow-hidden rounded-[28px] border border-sky-950/[0.06] bg-white shadow-[0_18px_42px_rgba(22,138,242,0.09)]">
        <div className="flex flex-col gap-4 border-b border-sky-950/[0.06] bg-[linear-gradient(180deg,#F4FCFF_0%,#ffffff_100%)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#168AF2]">Form Agent</p>
            <h2 className="mt-1 text-2xl font-black leading-[1.15] tracking-normal text-slate-950 sm:text-[28px]">Identitas Agent Baru</h2>
          </div>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-50 text-[#168AF2] ring-1 ring-inset ring-sky-100 sm:h-14 sm:w-14">
            <UserPlus className="h-6 w-6" strokeWidth={2.2} />
          </span>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Nama Agent" icon={UserRound}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="nama agent"
              autoComplete="name"
              className="h-12 w-full rounded-2xl border border-sky-950/[0.08] bg-[#F4FCFF] px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-[#168AF2] focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </Field>
          <Field label="Email Login" icon={Mail}>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@gmail.com"
              type="email"
              autoComplete="email"
              className="h-12 w-full rounded-2xl border border-sky-950/[0.08] bg-[#F4FCFF] px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-[#168AF2] focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </Field>
          <Field label="Nomor WA" icon={Phone}>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="08xxxxxxxxxx"
              inputMode="tel"
              autoComplete="tel"
              className="h-12 w-full rounded-2xl border border-sky-950/[0.08] bg-[#F4FCFF] px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-[#168AF2] focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </Field>
          <Field label="Nama Toko" icon={Store}>
            <input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="Nama konter/toko"
              autoComplete="organization"
              className="h-12 w-full rounded-2xl border border-sky-950/[0.08] bg-[#F4FCFF] px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-[#168AF2] focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </Field>
          <div className="min-w-0 [grid-column:1/-1]">
            <Field label="Password Awal" icon={KeyRound} helper="Berikan password ini ke agent, lalu sarankan diganti setelah login.">
              <div className="flex min-w-0 gap-2">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="h-12 min-w-0 flex-1 rounded-2xl border border-sky-950/[0.08] bg-[#F4FCFF] px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-[#168AF2] focus:bg-white focus:ring-4 focus:ring-sky-100 sm:px-4"
                />
                <button
                  type="button"
                  onClick={() => setPassword(makePassword())}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-50 text-[#168AF2] ring-1 ring-inset ring-sky-100 transition hover:bg-sky-100"
                  aria-label="Buat password baru"
                  title="Buat password baru"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-100"
                  aria-label="Salin password"
                  title="Salin password"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </Field>
          </div>
        </div>

        <div className="border-t border-sky-950/[0.06] bg-[#F4FCFF] p-5 sm:p-6">
          {message ? (
            <div className={message.type === "success" ? "mb-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-black text-[#168AF2]" : "mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-600"}>
              {message.text}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#168AF2,#21D5ED)] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(215,7,23,0.24)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BadgeCheck className="h-5 w-5" />}
            {loading ? "Membuat Agent..." : "Buat Akun Agent"}
          </button>
        </div>
      </section>

    </form>
  );
}
