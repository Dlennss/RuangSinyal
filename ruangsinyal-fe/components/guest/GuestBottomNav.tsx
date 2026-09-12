"use client";

import { usePathname } from "next/navigation";
import { Bell, Clock3, Grid2X2, Home, UserRound } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";

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
    <BottomNav
      items={[
        { label: "Beranda", href: "/", icon: Home, active: homeActive },
        { label: "Riwayat", href: "/transaksi", icon: Clock3, active: historyActive },
        { label: "Menu", href: menuHref, icon: Grid2X2, active: menuActive },
        {
          label: "Notifikasi",
          href: notificationHref,
          icon: Bell,
          active: notificationActive,
        },
        { label: "Akun", href: accountHref, icon: UserRound, active: accountActive },
      ]}
    />
  );
}
