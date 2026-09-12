import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { SiteShell } from "@/components/site/SiteShell";
import { authOptions } from "@/lib/nextauth";
import type { UserSession } from "@/components/user/types";
import { AppTopHeader } from "@/components/shared/AppTopHeader";

export const metadata: Metadata = {
  title: "RuangSinyal",
  description: "Topup & PPOB cepat",
};

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = (await getServerSession(authOptions)) as SessionShape | null;

  return (
    <div className="min-h-dvh bg-[#dff7ff] text-neutral-900 md:py-4">
      <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-hidden bg-[#dff7ff] md:w-97.5 md:max-w-none">
        <AppTopHeader isLoggedIn={Boolean(session?.backendToken)} />
        <SiteShell>{children}</SiteShell>
      </div>
    </div>
  );
}
