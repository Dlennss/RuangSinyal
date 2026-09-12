'use client';

import Image from 'next/image';
import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { GuestAdItem } from '@/lib/api.ads';

type GuestAdsCarouselProps = {
  items: GuestAdItem[];
};

const fallbackAds: GuestAdItem[] = [
  {
    id: -1,
    judul: "",
    keterangan: "",
    image_url: "/ruangsinyal-assets/banners/bener1.png",
    link_url: "/pulsa",
    urutan: 1,
    aktif: true,
  },
  {
    id: -2,
    judul: "",
    keterangan: "",
    image_url: "/ruangsinyal-assets/banners/bener2.png",
    link_url: "/kategori",
    urutan: 2,
    aktif: true,
  },
  {
    id: -3,
    judul: "",
    keterangan: "",
    image_url: "/ruangsinyal-assets/banners/bener3.png",
    link_url: "/pulsa-data",
    urutan: 3,
    aktif: true,
  },
];

const ruangSinyalBannerUrls = [
  "/ruangsinyal-assets/banners/bener1.png",
  "/ruangsinyal-assets/banners/bener2.png",
  "/ruangsinyal-assets/banners/bener3.png",
];

function isLegacyGuestBanner(imageUrl: string) {
  const normalized = imageUrl.toLowerCase();
  return normalized.includes("/images/guest-ads/");
}

function normalizeAdBanner(item: GuestAdItem, index: number): GuestAdItem {
  if (!isLegacyGuestBanner(item.image_url || "")) return item;
  return {
    ...item,
    judul: "",
    keterangan: "",
    image_url: ruangSinyalBannerUrls[index % ruangSinyalBannerUrls.length],
  };
}

export function GuestAdsCarousel({ items }: GuestAdsCarouselProps) {
  const activeAds = items.filter((item) => item.aktif !== false && item.image_url);
  const ads = (activeAds.length > 0 ? activeAds : fallbackAds).map(normalizeAdBanner);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const suppressClickRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);
  const safeActiveIndex = ads.length > 0 ? Math.min(activeIndex, ads.length - 1) : 0;

  useEffect(() => {
    if (ads.length <= 1 || isPaused) return;
    const timer = window.setInterval(() => {
      if (document.hidden || touchStartXRef.current !== null) return;
      setActiveIndex((prev) => (prev + 1) % ads.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [ads.length, isPaused]);

  function moveToPrev() {
    setActiveIndex((prev) => (prev - 1 + ads.length) % ads.length);
  }

  function moveToNext() {
    setActiveIndex((prev) => (prev + 1) % ads.length);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    suppressClickRef.current = false;
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchDeltaXRef.current = 0;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    if (touchStartXRef.current == null) return;
    const currentX = event.touches[0]?.clientX ?? touchStartXRef.current;
    touchDeltaXRef.current = currentX - touchStartXRef.current;
  }

  function handleTouchEnd() {
    if (touchStartXRef.current == null || ads.length <= 1) {
      touchStartXRef.current = null;
      touchDeltaXRef.current = 0;
      return;
    }

    const delta = touchDeltaXRef.current;
    if (Math.abs(delta) >= 40) {
      suppressClickRef.current = true;
      if (delta > 0) {
        moveToPrev();
      } else {
        moveToNext();
      }
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  }

  return (
    <section
      aria-label="Promo RuangSinyal"
      aria-roledescription="carousel"
      className="relative overflow-hidden rounded-[20px] bg-[#168AF2] shadow-[0_16px_34px_rgba(22,138,242,0.12)] ring-1 ring-sky-950/[0.04] [touch-action:pan-y]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartXRef.current = null;
        touchDeltaXRef.current = 0;
      }}
      onClickCapture={(event) => {
        if (!suppressClickRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
      }}
    >
      <div
        className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{
          transform: `translateX(-${safeActiveIndex * 100}%)`,
        }}
      >
        {ads.map((item, index) => {
          const hasCaption = Boolean(item.judul || item.keterangan);
          const content = (
            <div
              className="relative w-full overflow-hidden bg-[#168AF2] [aspect-ratio:2285/688]"
            >
              <Image
                src={item.image_url}
                alt={item.judul || 'Iklan RuangSinyal'}
                fill
                sizes="(min-width: 768px) 374px, (max-width: 448px) calc(100vw - 16px), 432px"
                className="object-cover"
                loading="eager"
                fetchPriority={index === 0 ? "high" : "low"}
                unoptimized={!item.image_url.startsWith('/ruangsinyal-assets/')}
              />
              {hasCaption ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 space-y-1 px-4 pb-3 pt-10 text-white">
                    {item.judul ? <h3 className="text-sm font-bold leading-tight sm:text-base">{item.judul}</h3> : null}
                    {item.keterangan ? (
                      <p className="max-w-[92%] text-[11px] leading-4 text-white/92 sm:text-sm">{item.keterangan}</p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          );

          if (item.link_url) {
            return (
              <a
                key={item.id}
                href={item.link_url}
                className="block w-full min-w-0 shrink-0"
                tabIndex={index === safeActiveIndex ? 0 : -1}
                aria-hidden={index !== safeActiveIndex}
              >
                {content}
              </a>
            );
          }

          return (
            <div
              key={item.id}
              className="w-full min-w-0 shrink-0"
              aria-hidden={index !== safeActiveIndex}
            >
              {content}
            </div>
          );
        })}
      </div>
      {ads.length > 1 ? (
        <>
          <button
            type="button"
            aria-label={isPaused ? "Putar banner otomatis" : "Jeda banner otomatis"}
            title={isPaused ? "Putar banner otomatis" : "Jeda banner otomatis"}
            onClick={() => setIsPaused((value) => !value)}
            className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center px-4 pb-1.5">
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-slate-950/20 px-2 py-1 backdrop-blur-sm">
              {ads.map((dotItem, index) => (
                <button
                  key={dotItem.id}
                  type="button"
                  aria-label={`Buka iklan ${index + 1}`}
                  aria-pressed={index === safeActiveIndex}
                  onClick={() => setActiveIndex(index)}
                  className={index === safeActiveIndex ? 'h-1.5 w-5 rounded-full bg-white/95' : 'h-1.5 w-1.5 rounded-full bg-white/55'}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
