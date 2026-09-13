import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, BriefcaseBusiness, ClipboardList, ChevronRight, FileText, HelpCircle, LockKeyhole, Mail, Pencil, Phone, UserPlus, UsersRound } from "lucide-react";
import { getAppServerSession } from "@/lib/server-auth";
import { getUserProfile } from "@/lib/api.auth";
import { getInitials } from "@/components/user/helpers";
import { roleLabel } from "@/lib/memberRoles";
import type { UserSession } from "@/components/user/types";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { UserLogoutButton } from "@/components/user/UserLogoutButton";
import { UserProfilePhotoUploader } from "@/components/user/UserProfilePhotoUploader";

type SessionShape = { user?: UserSession; backendToken?: string };

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();
  return ["analyst", "operator", "operator kredit", "operator_kredit", "operator_credit", "operator-credit"].includes(value) ? "analis" : value;
}

function panelPathByRole(role: string) {
  if (role === "admin" || role === "staff") return "/dashboard/admin";
  if (role === "auditor") return "/dashboard/auditor";
  if (role === "member" || role === "agent_member" || role === "master_member") return "/dashboard/member";
  if (role === "analis") return "/dashboard/master/operator";
  if (role === "master" || role === "marketing") return "/dashboard/master";
  if (role === "operator_trx") return "/dashboard/operator";
  if (role === "operator_wallet") return "/dashboard/wallet";
  return "/user";
}

export default async function UserAccountPage() {
  const session = (await getAppServerSession()) as SessionShape | null;
  if (!session?.backendToken) redirect("/login");

  const user = session.user ?? null;
  const profile = await getUserProfile(session.backendToken);
  const displayName = profile?.nama || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "";
  const profileWithPhone = profile as typeof profile & { phone?: string; no_hp?: string; nomor_hp?: string; telepon?: string };
  const phone = profileWithPhone?.phone || profileWithPhone?.no_hp || profileWithPhone?.nomor_hp || profileWithPhone?.telepon || "";
  const role = normalizeRole(profile?.role || user?.role);
  const canManageRetailNetwork = role === "master" || role === "agent";
  const canOpenWorkPanel = role !== "user" && role !== "agent" && role !== "marketing";

  const personalItems = [
    { label: "Nomor handphone", value: phone || "Belum ditambahkan", icon: Phone },
    { label: "Email", value: displayEmail || "Belum ditambahkan", icon: Mail },
  ];

  const networkItems = [
    ...(role === "marketing" ? [
      { href: "/user/account/tambah-agent", label: "Tambah Agent", icon: UserPlus },
      { href: "/user/account/pengajuan-agent", label: "Pengajuan & Dokumen", icon: ClipboardList },
      { href: "/user/account/agent-binaan", label: "Agent Binaan", icon: UsersRound },
    ] : []),
    ...(canOpenWorkPanel ? [{ href: panelPathByRole(role), label: "Panel Kerja", icon: BriefcaseBusiness }] : []),
    ...(canManageRetailNetwork ? [{ href: "/user/account/downline", label: role === "agent" ? "Tambah Member" : "Jaringan Retail", icon: UsersRound }] : []),
  ];
  const menuGroups = [
    { title: "Kelola jaringan", tone: "bg-sky-50 text-sky-600", items: networkItems },
    { title: "Keamanan", tone: "bg-emerald-50 text-emerald-700", items: role !== "marketing" ? [
      { href: "/user/account/security", label: "Password Akun", icon: LockKeyhole },
    ] : [] },
    { title: "Notifikasi & Bantuan", tone: "bg-sky-50 text-sky-600", items: [
      ...(role !== "marketing" ? [
        { href: "/user/notifikasi", label: "Notifikasi", icon: Bell },
        { href: "https://wa.me/6282219107558", label: "Hubungi Bantuan", icon: HelpCircle },
      ] : []),
      { href: "/kebijakan-privasi?from=account", label: "Syarat & Kebijakan", icon: FileText },
    ] },
  ].filter((group) => group.items.length > 0);

  return (
    <main className="min-h-screen bg-[#EFFBFF] pb-28">
      <section aria-labelledby="account-title" className="border-b border-sky-100 bg-white px-4 pb-5 pt-5 shadow-[0_4px_14px_rgba(8,76,120,0.04)]">
        <h1 id="account-title" className="mb-5 text-xl font-bold tracking-normal text-slate-950">Akun Saya</h1>
        <div className="flex items-start gap-3">
          <UserProfilePhotoUploader name={displayName} email={displayEmail} phone={phone}
            initials={getInitials(displayName, displayEmail)} profilePhotoURL={profile?.profile_photo_url || user?.image || ""} />
          <div className="min-w-0 flex-1 py-1">
            <h2 className="break-words text-lg font-bold leading-6 tracking-normal text-slate-950">{displayName}</h2>
            <span className="mt-2 inline-flex rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">{role === "user" ? "Pengguna" : roleLabel(role)}</span>
          </div>
          <Link href="/user/account/edit" aria-label="Edit profil" title="Edit profil" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-sky-100 bg-sky-50 !text-sky-700 transition hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-sky-600">
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="personal-title" className="mt-5">
        <h2 id="personal-title" className="mb-2 px-4 text-xs font-semibold text-slate-500">Informasi pribadi</h2>
        <dl className="divide-y divide-slate-100 border-y border-sky-100 bg-white px-4">
          {personalItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 py-3.5">
              <item.icon className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">{item.label}</dt>
                <dd className="mt-1 break-words text-sm font-medium leading-5 text-slate-900">{item.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {menuGroups.map((group) => (
        <section key={group.title} aria-label={group.title} className="mt-5">
          <h2 className="mb-2 px-4 text-xs font-semibold text-slate-500">{group.title}</h2>
          <div className="divide-y divide-slate-100 border-y border-sky-100 bg-white">
            {group.items.map((item) => (
              <Link key={item.label} href={item.href} target={item.href.startsWith("https://") ? "_blank" : undefined} rel={item.href.startsWith("https://") ? "noopener noreferrer" : undefined}
                className="flex min-h-14 items-center gap-3 px-4 py-2.5 !text-slate-900 transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${group.tone}`}><item.icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1 break-words text-sm font-medium leading-5">{item.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-6 px-4">
        <UserLogoutButton className="h-12 w-full rounded-lg border border-rose-100 bg-rose-50 text-sm font-semibold !text-rose-700 shadow-none hover:bg-rose-100 focus-visible:ring-rose-200" />
      </div>
      <p className="px-4 pt-4 text-center text-xs text-slate-400">RuangSinyal</p>
      <UserBottomNav />
    </main>
  );
}
