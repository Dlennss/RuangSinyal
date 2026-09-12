import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

function UserHomeHero({ saldo }: { saldo: number }) {
  return (
    <section className="relative isolate mx-auto h-[224px] w-full overflow-hidden rounded-b-[22px] bg-[#35B6F2] text-white shadow-[0_14px_34px_rgba(22,138,242,0.20)] min-[390px]:h-[232px] sm:h-[280px]">
      <Image
        src="/ruangsinyal-assets/header_hero_clean.png"
        alt="RuangSinyal"
        fill
        priority
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover object-top"
      />
      <Link
        href="/user/saldo"
        prefetch={false}
        aria-label={`Saldo Anda ${formatIDR(saldo)}`}
        className="absolute right-5 top-5 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-[#062B74] shadow-[0_10px_24px_rgba(6,43,116,0.14)]"
      >
        {formatIDR(saldo)}
      </Link>
    </section>
  );
}

function UserHomeInfoStrip() {
  return (
    <section className="relative z-10 overflow-hidden rounded-[18px] border border-white bg-white px-4 py-3 shadow-[0_14px_32px_rgba(6,43,116,0.10)] ring-1 ring-sky-100/80">
      <div className="flex items-center gap-3">
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[14px] bg-white shadow-[0_10px_20px_rgba(22,138,242,0.14)] ring-1 ring-sky-100">
          <Image src="/ruangsinyal-assets/logo_mark_512.png" alt="" fill sizes="44px" className="object-contain p-1.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold leading-4 text-[#657596]">Transaksi Cepat, Harga Bersahabat</span>
          <span className="mt-0.5 block text-[16px] font-black leading-5 text-[#06184f]">Koneksi Lancar, Hidup Makin Mudah!</span>
        </span>
        <Link
          href="/user/kategori"
          prefetch={false}
          aria-label="Lihat layanan"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-linear-to-br from-[#7cf3f5] to-[#35B6F2] text-[#062B74] shadow-[0_10px_20px_rgba(22,138,242,0.16)]"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={3} />
        </Link>
      </div>
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
      <UserHomeHero saldo={saldo} />
      <div className="relative mx-auto -mt-3 w-full space-y-4 px-2">
        <UserHomeInfoStrip />
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
