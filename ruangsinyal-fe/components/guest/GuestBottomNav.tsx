"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Clock3, Grid2X2, Home, UserRound } from "lucide-react";

function navClass(active: boolean) {
  return active
    ? "relative flex min-w-0 flex-col items-center justify-center gap-1 pb-2 pt-1 text-[#168AF2]! visited:text-[#168AF2]!"
    : "relative flex min-w-0 flex-col items-center justify-center gap-1 pb-2 pt-1 text-slate-500! transition visited:text-slate-500! hover:text-[#062B74]!";
}

const iconClass = "h-6 w-6 stroke-[2.4]";
const textClass = "block max-w-full truncate text-[11px] font-black leading-none";
const activeIndicatorClass = "absolute bottom-0 left-1/2 h-1 w-7 -translate-x-1/2 rounded-full bg-[#168AF2]";
const navShellClass =
  "h-[78px] px-2 pb-2 pt-2";
const navSafeSpaceClass =
  "pointer-events-none h-[calc(112px+env(safe-area-inset-bottom))]";

type GuestBottomNavProps = {
  isLoggedIn?: boolean;
};

export function GuestBottomNav({ isLoggedIn = false }: GuestBottomNavProps) {
  const pathname = usePathname() || "";
  const homeActive = pathname === "/";
  const historyActive = pathname.startsWith("/transaksi");
  const accountHref = isLoggedIn ? "/user/account" : "/login";
  const notificationHref = isLoggedIn ? "/user/notifikasi" : "/login";
  const menuHref = isLoggedIn ? "/user/kategori" : "/kategori";
  const notificationActive = pathname.startsWith("/user/notifikasi");
  const menuActive = pathname.startsWith("/user/kategori") || pathname.startsWith("/kategori");
  const accountActive = isLoggedIn
    ? pathname.startsWith("/user/account")
    : pathname.startsWith("/login");

  return (
    <>
      <div aria-hidden="true" className={navSafeSpaceClass} />
      <section className="fixed inset-x-0 bottom-0 z-[90] mx-auto w-full max-w-md bg-linear-to-t from-[#dff7ff] via-[#dff7ff]/95 to-transparent px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 md:w-97.5">
        <div className={`grid grid-cols-5 items-stretch overflow-hidden rounded-[26px] border border-white bg-white shadow-[0_-10px_30px_rgba(6,43,116,0.12)] ring-1 ring-sky-100 ${navShellClass}`}>
          <Link href="/" prefetch={false} className={navClass(homeActive)}>
            <Home className={iconClass} fill={homeActive ? "currentColor" : "none"} />
            <span className={textClass}>Beranda</span>
            {homeActive ? <span className={activeIndicatorClass} /> : null}
          </Link>

          <Link href="/transaksi" prefetch={false} className={navClass(historyActive)}>
            <Clock3 className={iconClass} />
            <span className={textClass}>Riwayat</span>
            {historyActive ? <span className={activeIndicatorClass} /> : null}
          </Link>

          <Link href={menuHref} prefetch={false} className={navClass(menuActive)}>
            <Grid2X2 className={iconClass} />
            <span className={textClass}>Menu</span>
            {menuActive ? <span className={activeIndicatorClass} /> : null}
          </Link>

          <Link href={notificationHref} prefetch={false} className={navClass(notificationActive)}>
            <span className="relative">
              <Bell className={iconClass} />
              <span className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#168AF2] ring-2 ring-white" />
            </span>
            <span className={textClass}>Notifikasi</span>
            {notificationActive ? <span className={activeIndicatorClass} /> : null}
          </Link>

          <Link href={accountHref} prefetch={false} className={navClass(accountActive)}>
            <UserRound className={iconClass} />
            <span className={textClass}>Akun</span>
            {accountActive ? <span className={activeIndicatorClass} /> : null}
          </Link>
        </div>
      </section>
    </>
  );
}
