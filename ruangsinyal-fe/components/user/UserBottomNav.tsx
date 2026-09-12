"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Clock3, Grid2X2, Home, UserRound } from "lucide-react";

type NotificationSourceItem = {
  id?: number | string;
  invoice_id?: string;
  dibuat_pada?: string | null;
  diubah_pada?: string | null;
};

function navClass(active: boolean) {
  return active
    ? "relative flex min-w-0 flex-col items-center justify-center gap-1 pb-2 pt-1 text-[#168AF2]! visited:text-[#168AF2]!"
    : "relative flex min-w-0 flex-col items-center justify-center gap-1 pb-2 pt-1 text-slate-500! transition visited:text-slate-500! hover:text-[#062B74]!";
}

function isActivePath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

const iconClass = "h-6 w-6 stroke-[2.4]";
const textClass = "block max-w-full truncate text-[11px] font-black leading-none";
const activeIndicatorClass = "absolute bottom-0 left-1/2 h-1 w-7 -translate-x-1/2 rounded-full bg-[#168AF2]";
const navShellClass = "h-[78px] px-2 pb-2 pt-2";
const navSafeSpaceClass = "pointer-events-none h-[calc(112px+env(safe-area-inset-bottom))]";

function getNotificationStorageKey(token: string) {
  return `ruangsinyal:last_notification_seen:${token.slice(-16)}`;
}

function getItemTime(item: NotificationSourceItem) {
  const value = item.diubah_pada || item.dibuat_pada || "";
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLatestTime(items: NotificationSourceItem[]) {
  return items.reduce((latest, item) => Math.max(latest, getItemTime(item)), 0);
}

function UserNotificationBadge({ active }: { active: boolean }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function syncUnread() {
      const token = String(localStorage.getItem("auth_token") || "").trim();
      if (!token) {
        setUnreadCount(0);
        return;
      }

      const storageKey = getNotificationStorageKey(token);

      if (active) {
        setUnreadCount(0);
      }

      try {
        const response = await fetch("/api/app/me/orders?limit=20&offset=0", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const payload = await response.json().catch(() => []);
        const items = (Array.isArray(payload) ? payload : []) as NotificationSourceItem[];
        const latestTime = getLatestTime(items);
        const storedSeen = Number(localStorage.getItem(storageKey) || "0");

        if (active) {
          if (latestTime > 0) localStorage.setItem(storageKey, String(latestTime));
          if (!cancelled) setUnreadCount(0);
          return;
        }

        if (!storedSeen) {
          if (latestTime > 0) localStorage.setItem(storageKey, String(latestTime));
          if (!cancelled) setUnreadCount(0);
          return;
        }

        const nextUnread = items.filter((item) => getItemTime(item) > storedSeen).length;
        if (!cancelled) setUnreadCount(Math.min(nextUnread, 99));
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    }

    syncUnread();
    const interval = window.setInterval(syncUnread, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [active]);

  if (unreadCount <= 0) return null;

  return (
    <span className="absolute -right-1.5 -top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#168AF2] px-1 text-[9px] font-black leading-none text-white ring-1 ring-white">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
}

export function UserBottomNav() {
  const pathname = usePathname() || "";
  const trxActive = isActivePath(pathname, "/user/transaksi");
  const menuActive =
    isActivePath(pathname, "/user/kategori") ||
    isActivePath(pathname, "/user/pulsa-data") ||
    isActivePath(pathname, "/user/listrik") ||
    isActivePath(pathname, "/user/ewallet") ||
    isActivePath(pathname, "/game");
  const notificationActive = isActivePath(pathname, "/user/notifikasi");
  const accountActive = isActivePath(pathname, "/user/account");
  const homeActive = pathname === "/user";

  return (
    <>
      <div aria-hidden="true" className={navSafeSpaceClass} />
      <section className="fixed inset-x-0 bottom-0 z-[90] mx-auto w-full max-w-md bg-linear-to-t from-[#dff7ff] via-[#dff7ff]/95 to-transparent px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 md:w-97.5">
        <div className={`grid grid-cols-5 items-stretch overflow-hidden rounded-[26px] border border-white bg-white shadow-[0_-10px_30px_rgba(6,43,116,0.12)] ring-1 ring-sky-100 ${navShellClass}`}>
          <Link href="/user" prefetch={false} className={navClass(homeActive)}>
            <Home className={iconClass} fill={homeActive ? "currentColor" : "none"} />
            <span className={textClass}>Beranda</span>
            {homeActive ? <span className={activeIndicatorClass} /> : null}
          </Link>

          <Link href="/user/transaksi" prefetch={false} className={navClass(trxActive)}>
            <Clock3 className={iconClass} />
            <span className={textClass}>Riwayat</span>
            {trxActive ? <span className={activeIndicatorClass} /> : null}
          </Link>

          <Link href="/user/kategori" prefetch={false} className={navClass(menuActive)}>
            <Grid2X2 className={iconClass} />
            <span className={textClass}>Menu</span>
            {menuActive ? <span className={activeIndicatorClass} /> : null}
          </Link>

          <Link href="/user/notifikasi" prefetch={false} className={navClass(notificationActive)}>
            <span className="relative">
              <Bell className={iconClass} />
              <UserNotificationBadge active={notificationActive} />
            </span>
            <span className={textClass}>Notifikasi</span>
            {notificationActive ? <span className={activeIndicatorClass} /> : null}
          </Link>

          <Link href="/user/account" prefetch={false} className={navClass(accountActive)}>
            <UserRound className={iconClass} />
            <span className={textClass}>Akun</span>
            {accountActive ? <span className={activeIndicatorClass} /> : null}
          </Link>
        </div>
      </section>
    </>
  );
}
