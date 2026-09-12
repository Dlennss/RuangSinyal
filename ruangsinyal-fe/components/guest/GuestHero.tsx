"use client";

import Image from "next/image";
import Link from "next/link";
import { Headset } from "lucide-react";

type GuestHeroProps = {
  isLoggedIn?: boolean;
};

export function GuestHero({ isLoggedIn = false }: GuestHeroProps) {
  return (
    <section className="sticky top-0 z-30 overflow-hidden border-b border-white/30 bg-[#168AF2] px-4 py-2 text-white shadow-[0_10px_24px_rgba(22,138,242,0.18)] backdrop-blur-sm">
      <Image
        src="/ruangsinyal-assets/header_tower_strip.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-fill"
      />
      <div className="pointer-events-none absolute inset-0 bg-sky-500/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/70 to-transparent" />

      <div className="relative flex h-12 items-center justify-between gap-3">
        <div className="min-w-0 flex-1 pr-2">
          <Link href="/" className="inline-flex h-11 max-w-[64vw] items-center rounded-[15px] bg-white/96 px-2.5 shadow-[0_8px_18px_rgba(6,43,116,0.12)] ring-1 ring-white/70">
            <Image
              src="/images/logo-ruangsinyal-header.png"
              alt="RuangSinyal"
              width={210}
              height={48}
              className="h-8 w-auto max-w-full object-contain"
              priority
            />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/6282219107558"
            target="_blank"
            rel="noreferrer"
            className="grid h-7 w-7 place-items-center rounded-full border border-white/60 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Hubungi bantuan via WhatsApp"
          >
            <Headset className="h-4 w-4" />
          </a>
          <Link
            href={isLoggedIn ? "/user/account" : "/login"}
            className="inline-flex h-8 items-center rounded-full border border-white/70 bg-white/15 px-3 text-xs font-black text-white shadow-[0_8px_18px_rgba(6,43,116,0.10)] hover:bg-white/24"
          >
            {isLoggedIn ? "Akun" : "Masuk"}
          </Link>
        </div>
      </div>
    </section>
  );
}
