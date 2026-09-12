"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type AppTopHeaderProps = {
  isLoggedIn?: boolean;
  userName?: string | null;
  saldo?: number | null;
  role?: string | null;
};

export function AppTopHeader({ isLoggedIn = false, userName, saldo, role }: AppTopHeaderProps) {
  const pathname = usePathname() || "";
  const normalizedRole = String(role || "").trim().toLowerCase();
  const isRetailLoggedIn = isLoggedIn && (normalizedRole === "user" || normalizedRole === "agent" || normalizedRole === "master");
  const homeHref = isRetailLoggedIn ? "/user" : "/";
  void userName;
  void saldo;

  if (pathname === "/" || pathname === "/user") return null;

  return (
    <header className="sticky top-0 z-30 overflow-hidden bg-[#168AF2] px-4 py-2 text-white shadow-[0_12px_28px_rgba(22,138,242,0.18)]">
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
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            href={homeHref}
            prefetch={false}
            className="inline-flex h-11 max-w-[68vw] min-w-0 items-center rounded-[15px] bg-white/96 px-2.5 shadow-[0_8px_18px_rgba(6,43,116,0.12)] ring-1 ring-white/70"
            aria-label="RuangSinyal"
          >
            <span className="relative block h-8 w-[150px] min-w-0">
              <Image
                src="/images/logo-ruangsinyal-header.png"
                alt="RuangSinyal"
                fill
                priority
                sizes="150px"
                className="object-contain object-left"
              />
            </span>
          </Link>
        </div>

        <div className="h-10 w-10 shrink-0" aria-hidden="true" />
      </div>
    </header>
  );
}
