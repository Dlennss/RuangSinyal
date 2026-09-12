import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAppServerSession } from "@/lib/server-auth";
import type { UserSession } from "@/components/user/types";
import { AppTopHeader } from "@/components/shared/AppTopHeader";

export const metadata: Metadata = {
  title: "User Area - RuangSinyal",
  description: "Aplikasi user untuk pembelian produk digital langsung.",
};

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = (await getAppServerSession()) as SessionShape | null;
  const role = String(session?.user?.role || "").trim().toLowerCase();
  const isRetailRole = role === "user" || role === "agent" || role === "master" || role === "marketing";

  if (!session?.backendToken) {
    redirect("/login");
  }

  if (session?.backendToken && role && !isRetailRole) {
    if (role === "admin" || role === "staff") redirect("/dashboard/admin");
    if (role === "member" || role === "agent_member" || role === "master_member") redirect("/dashboard/member");
    if (role === "operator_trx") redirect("/dashboard/operator");
    if (role === "operator_wallet") redirect("/dashboard/wallet");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh bg-[#dff7ff] text-neutral-900 md:py-4">
      <div className="relative mx-auto min-h-dvh w-full max-w-md bg-[#EFFBFF] md:w-97.5 md:max-w-none">
        <AppTopHeader
          isLoggedIn={Boolean(session?.backendToken)}
          role={role}
        />
        <div className="min-h-svh">
          {children}
        </div>
      </div>
    </div>
  );
}
