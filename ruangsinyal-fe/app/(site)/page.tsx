import { Suspense } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";
import { ChevronRight, ClipboardCheck, Grid3X3, ShieldCheck } from "lucide-react";
import { authOptions } from "@/lib/nextauth";
import { getCategories } from "@/lib/api.products";
import type { UserCategoryItem, UserSession } from "@/components/user/types";
import { GuestBottomNav } from "@/components/guest/GuestBottomNav";
import { GuestCategoryGrid } from "@/components/guest/GuestCategoryGrid";
import { GuestAdsSection } from "@/components/guest/GuestAdsSection";
import { GuestAdsCarouselSkeleton } from "@/components/guest/GuestAdsCarouselSkeleton";
import { CANONICAL_SITE_URL } from "@/lib/seo-articles";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

const homeTitle = "RuangSinyal | Pulsa, Paket Data, E-Wallet, Token Listrik, Game & PPOB";
const homeDescription =
  "RuangSinyal melayani isi pulsa, paket data, top up e-wallet, token listrik, top up game, dan pembayaran PPOB dengan alur cepat untuk pelanggan, member, dan agen.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  keywords: [
    "RuangSinyal",
    "isi pulsa online",
    "paket data murah",
    "top up e-wallet",
    "token listrik online",
    "top up game",
    "PPOB online",
  ],
  alternates: {
    canonical: CANONICAL_SITE_URL,
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: CANONICAL_SITE_URL,
    siteName: "RuangSinyal",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "RuangSinyal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: ["/twitter-image"],
  },
};

function HomeHero({ isLoggedIn }: { isLoggedIn: boolean }) {
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

function HomeInfoStrip() {
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
          href="/kategori"
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

function HomePopularActions() {
  const items = [
    {
      label: "Pilih Layanan",
      description: "Pulsa, data, e-wallet, PLN, game, dan PPOB.",
      icon: Grid3X3,
    },
    {
      label: "Isi Data",
      description: "Masukkan nomor atau ID pelanggan dengan rapi.",
      icon: ClipboardCheck,
    },
    {
      label: "Bayar Aman",
      description: "Lanjutkan pembayaran dan pantau status transaksi.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_16px_36px_rgba(22,138,242,0.10)] ring-1 ring-sky-950/[0.04]">
      <div className="relative overflow-hidden bg-linear-to-br from-[#168AF2] via-[#35B6F2] to-[#21D5ED] px-4 py-4 text-white">
        <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full border border-white/20" />
        <div className="absolute right-7 top-3 h-12 w-12 rounded-full border border-white/20" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black tracking-tight">Mulai Transaksi</h2>
            <p className="mt-1 text-xs font-semibold leading-4 text-white/85">Semua kebutuhan digital dalam satu menu RuangSinyal.</p>
          </div>
          <Link
            href="/kategori"
            prefetch={false}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-full bg-[#062B74] px-4 text-xs font-black text-white shadow-[0_12px_24px_rgba(22,138,242,0.22)] ring-1 ring-white/25"
          >
            Buka Menu
            <ChevronRight className="h-4 w-4" strokeWidth={3} />
          </Link>
        </div>
      </div>

      <div className="grid gap-2 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-[#EFFBFF] px-3 py-3 ring-1 ring-sky-100/70">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#168AF2] shadow-[0_10px_22px_rgba(22,138,242,0.10)]">
                <Icon className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black leading-4 text-slate-950">{item.label}</span>
                <span className="mt-1 block text-xs font-semibold leading-4 text-slate-500">{item.description}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function GuestHomePage() {
  const session = (await getServerSession(authOptions)) as SessionShape | null;
  const categories = (await getCategories()) as UserCategoryItem[];
  const activeCategories = categories.filter((item) => item.aktif);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RuangSinyal",
    url: CANONICAL_SITE_URL,
    description: homeDescription,
    inLanguage: "id-ID",
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RuangSinyal",
    url: CANONICAL_SITE_URL,
    logo: `${CANONICAL_SITE_URL}/images/logo-ruangsinyal.png`,
    image: `${CANONICAL_SITE_URL}/opengraph-image`,
    description: homeDescription,
  };

  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "RuangSinyal",
    url: CANONICAL_SITE_URL,
    description: homeDescription,
    about: activeCategories.map((item) => item.nama),
    mainEntity: {
      "@type": "OfferCatalog",
      name: "Kategori Produk RuangSinyal",
      itemListElement: activeCategories.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Thing",
          name: item.nama,
        },
      })),
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Produk apa saja yang tersedia di RuangSinyal?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "RuangSinyal menyediakan isi pulsa, paket data, top up e-wallet, token listrik, top up game, BPJS, PDAM, internet pascabayar, TV, dan layanan PPOB lain untuk pelanggan, member, dan agen.",
        },
      },
      {
        "@type": "Question",
        name: "Apakah RuangSinyal cocok untuk calon member dan agen?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ya. RuangSinyal bisa dipakai untuk kebutuhan transaksi harian sekaligus untuk member, agen, reseller, dan kebutuhan H2H dengan katalog produk digital yang lengkap.",
        },
      },
      {
        "@type": "Question",
        name: "Apa keunggulan RuangSinyal untuk transaksi produk digital?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "RuangSinyal menata kategori produk secara jelas, menyediakan banyak layanan dalam satu tempat, dan memudahkan pembeli maupun penjual untuk melayani kebutuhan digital harian dengan lebih cepat.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#dff7ff]">
      <Script id="homepage-website-jsonld" type="application/ld+json">
        {JSON.stringify(websiteJsonLd)}
      </Script>
      <Script id="homepage-organization-jsonld" type="application/ld+json">
        {JSON.stringify(organizationJsonLd)}
      </Script>
      <Script id="homepage-catalog-jsonld" type="application/ld+json">
        {JSON.stringify(catalogJsonLd)}
      </Script>
      <Script id="homepage-faq-jsonld" type="application/ld+json">
        {JSON.stringify(faqJsonLd)}
      </Script>
      <HomeHero isLoggedIn={!!session?.backendToken} />
      <div className="relative mx-auto -mt-3 w-full space-y-4 px-2">
        <HomeInfoStrip />
        <GuestCategoryGrid items={categories} />
        <Suspense fallback={<GuestAdsCarouselSkeleton />}>
          <GuestAdsSection />
        </Suspense>
        <HomePopularActions />
      </div>

      <GuestBottomNav isLoggedIn={!!session?.backendToken} />
    </main>
  );
}
