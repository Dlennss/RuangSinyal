import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { getAppServerSession } from "@/lib/server-auth";
import { getUserProfile } from "@/lib/api.auth";
import { getCategories } from "@/lib/api.products";
import type { UserCategoryItem, UserSession } from "@/components/user/types";
import { UserCategoryGrid } from "@/components/user/UserCategoryGrid";
import { UserHomeSummary } from "@/components/user/UserMainSections";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { UserAuthClientSync } from "@/components/user/UserAuthClientSync";
import { GuestAdsSection } from "@/components/guest/GuestAdsSection";
import { GuestAdsCarouselSkeleton } from "@/components/guest/GuestAdsCarouselSkeleton";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

function formatIDR(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function UserHomeHero() {
  return (
    <section className="relative isolate mx-auto h-[224px] w-full overflow-hidden rounded-[32px] bg-[#35B6F2] text-white min-[390px]:h-[232px]">
      <Image
        src="/ruangsinyal-assets/header_hero_clean.png"
        alt="RuangSinyal"
        fill
        priority
        sizes="(min-width: 768px) 390px, (max-width: 448px) 100vw, 448px"
        className="object-cover object-top"
      />
    </section>
  );
}

function UserHomeBalance({ saldo }: { saldo: number }) {
  const amount = formatIDR(saldo);
  return (
    <section aria-label="Saldo Anda" className="relative z-10 mx-3 -mt-3 grid min-h-22 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-sky-100 bg-white px-3 py-3 shadow-[0_6px_18px_rgba(8,76,120,0.12)]">
      <Link
        href="/user/saldo"
        prefetch={false}
        aria-label={`Lihat detail saldo, ${amount}`}
        className="min-w-0 rounded !text-[#062B74] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Wallet className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
            Saldo Anda
          </span>
          <span className={`mt-1 block break-words font-bold leading-9 tracking-normal text-[#062B74] tabular-nums ${amount.length > 12 ? "text-xl" : "text-[28px]"}`}>
            {amount}
          </span>
        </span>
      </Link>
      <Link
        href="/user/account/topup"
        prefetch={false}
        className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#0876CE] px-3 text-sm font-bold !text-white shadow-[0_3px_8px_rgba(8,118,206,0.22)] transition hover:bg-[#0665B2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
        Top Up
      </Link>
    </section>
  );
}

export default async function UserAppHomePage() {
  const session = (await getAppServerSession()) as SessionShape | null;
  const [categories, profile] = await Promise.all([
    getCategories() as Promise<UserCategoryItem[]>,
    session?.backendToken ? getUserProfile(session.backendToken) : Promise.resolve(null),
  ]);
  const role = String(profile?.role || session?.user?.role || "").trim().toLowerCase();
  const isAgent = role === "agent";
  const saldo = Number(profile?.saldo || 0);

  return (
    <main className="min-h-screen bg-[#dff7ff]">
      {session?.backendToken ? <UserAuthClientSync backendToken={session.backendToken} /> : null}
      <UserHomeHero />
      <UserHomeBalance saldo={saldo} />
      <div className="relative mx-auto mt-4 w-full space-y-4 px-2">
        <UserCategoryGrid items={categories} />
        <Suspense fallback={<GuestAdsCarouselSkeleton />}>
          <GuestAdsSection />
        </Suspense>
        <UserHomeSummary
          href="/user/kategori"
          variant={isAgent ? "agent" : "user"}
        />
      </div>

      <UserBottomNav />
    </main>
  );
}
