"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/85 ${className}`} />;
}

function UserSkeletonScreen() {
  return (
    <div className="fixed inset-0 z-[2147483647] bg-sky-50 text-slate-950">
      <div className="relative mx-auto min-h-dvh w-full max-w-3xl overflow-hidden bg-sky-50">
        <div className="bg-[linear-gradient(135deg,#168AF2,#168AF2_58%,#35B6F2)] px-4 pb-5 pt-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-full bg-white/25" />
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-4 w-28 bg-white/35" />
              <SkeletonBlock className="mt-2 h-3 w-40 bg-white/25" />
            </div>
            <SkeletonBlock className="h-10 w-10 rounded-2xl bg-white/30" />
          </div>
          <div className="mt-5 rounded-[26px] bg-white/12 p-4 ring-1 ring-white/15">
            <SkeletonBlock className="h-4 w-24 bg-white/30" />
            <SkeletonBlock className="mt-3 h-9 w-44 bg-white/40" />
            <SkeletonBlock className="mt-3 h-3 w-56 max-w-full bg-white/25" />
          </div>
        </div>

        <div className="space-y-4 px-4 py-5 pb-28">
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-[22px] bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                <SkeletonBlock className="mx-auto h-10 w-10 rounded-2xl bg-sky-100" />
                <SkeletonBlock className="mx-auto mt-2 h-3 w-10 bg-slate-200" />
              </div>
            ))}
          </div>

          <section className="rounded-[28px] border border-sky-100 bg-white p-4 shadow-[0_18px_42px_rgba(22,138,242,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <SkeletonBlock className="h-4 w-24 bg-sky-100" />
                <SkeletonBlock className="mt-2 h-6 w-44" />
              </div>
              <SkeletonBlock className="h-10 w-10 rounded-2xl bg-sky-100" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((item) => (
                <SkeletonBlock key={item} className="h-20 rounded-[22px] bg-slate-100" />
              ))}
            </div>
          </section>

          {[0, 1].map((item) => (
            <section key={item} className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <SkeletonBlock className="h-5 w-36" />
              <SkeletonBlock className="mt-3 h-4 w-full bg-slate-100" />
              <SkeletonBlock className="mt-2 h-4 w-3/4 bg-slate-100" />
            </section>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-6 py-3">
          <div className="grid grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonBlock key={item} className="mx-auto h-9 w-9 rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeletonScreen() {
  return (
    <div className="fixed inset-0 z-[2147483647] bg-[#050A14] text-white">
      <div className="flex min-h-dvh">
        <aside className="relative hidden w-[280px] shrink-0 border-r border-white/10 bg-[#053f31] p-5 md:block">
          <SkeletonBlock className="mx-auto h-8 w-32 bg-white/30" />
          <div className="mt-9 space-y-3">
            <SkeletonBlock className="h-11 w-full bg-white/20" />
            <SkeletonBlock className="h-10 w-11/12 bg-white/14" />
            <SkeletonBlock className="h-10 w-10/12 bg-white/14" />
          </div>
          <div className="absolute bottom-5 left-5 right-5 hidden md:block">
            <SkeletonBlock className="h-10 w-full bg-white/20" />
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-7">
          <div className="mb-5 flex h-14 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 md:hidden">
            <SkeletonBlock className="h-9 w-9 rounded-full bg-white/18" />
            <SkeletonBlock className="h-6 w-28 bg-white/20" />
            <SkeletonBlock className="h-9 w-9 rounded-full bg-white/18" />
          </div>

          <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-white text-slate-950 shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
            <div className="bg-[radial-gradient(circle_at_90%_10%,rgba(163,230,53,0.55),transparent_28%),linear-gradient(135deg,#168AF2_0%,#168AF2_48%,#21D5ED_100%)] p-5 sm:p-7">
              <SkeletonBlock className="h-5 w-28 bg-white/35" />
              <SkeletonBlock className="mt-4 h-9 w-64 max-w-full bg-white/35" />
              <SkeletonBlock className="mt-3 h-4 w-full max-w-md bg-white/25" />
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                    <SkeletonBlock className="h-4 w-20" />
                    <SkeletonBlock className="mt-3 h-7 w-24" />
                    <SkeletonBlock className="mt-3 h-3 w-16" />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
                <div className="rounded-[26px] border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <SkeletonBlock className="h-4 w-24" />
                      <SkeletonBlock className="mt-3 h-7 w-56 max-w-full" />
                    </div>
                    <SkeletonBlock className="hidden h-11 w-44 sm:block" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="rounded-3xl border border-sky-100 bg-sky-50/40 p-4">
                        <div className="flex gap-3">
                          <SkeletonBlock className="h-14 w-14 shrink-0 rounded-[20px]" />
                          <div className="min-w-0 flex-1">
                            <SkeletonBlock className="h-5 w-36" />
                            <SkeletonBlock className="mt-3 h-4 w-52 max-w-full" />
                            <div className="mt-4 grid grid-cols-2 gap-2">
                              <SkeletonBlock className="h-12" />
                              <SkeletonBlock className="h-12" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[26px] border border-slate-100 bg-white p-4 shadow-sm">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="mt-3 h-7 w-44" />
                  <div className="mt-5 space-y-3">
                    {[0, 1, 2].map((item) => (
                      <SkeletonBlock key={item} className="h-20 w-full rounded-3xl" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SiteSkeletonScreen() {
  return (
    <div className="fixed inset-0 z-[2147483647] bg-[#f7f7f7] text-slate-950">
      <div className="relative mx-auto min-h-dvh w-full max-w-3xl overflow-hidden bg-[#f7f7f7]">
        <section className="relative h-[280px] overflow-hidden rounded-b-[30px] bg-[#168AF2] shadow-[0_18px_42px_rgba(22,138,242,0.24)]">
          <div className="absolute inset-0 bg-[linear-gradient(140deg,#35B6F2_0%,#168AF2_48%,#062B74_100%)]" />
          <div className="absolute left-5 top-5">
            <SkeletonBlock className="h-12 w-56 bg-white/35" />
          </div>
          <div className="absolute bottom-9 right-7 w-[clamp(184px,54vw,206px)] rounded-[17px] bg-white p-3 shadow-[0_18px_40px_rgba(6,43,116,0.2)]">
            <div className="flex gap-3">
              <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full bg-sky-100" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-3 w-20 bg-slate-200" />
                <SkeletonBlock className="mt-2 h-5 w-28 bg-sky-100" />
                <SkeletonBlock className="mt-3 h-7 w-full rounded-full bg-sky-100" />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto -mt-8 space-y-4 px-4 pb-28">
          <section className="relative rounded-[18px] bg-white px-3.5 py-3 shadow-[0_16px_34px_rgba(22,138,242,0.11)] ring-1 ring-sky-950/[0.04]">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full bg-sky-100" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-3 w-44 bg-slate-100" />
                <SkeletonBlock className="mt-2 h-4 w-56 max-w-full bg-slate-200" />
              </div>
              <SkeletonBlock className="h-12 w-12 shrink-0 rounded-[14px] bg-sky-100" />
            </div>
          </section>

          <section className="rounded-[22px] bg-white p-4 shadow-[0_14px_34px_rgba(22,138,242,0.09)] ring-1 ring-sky-950/[0.04]">
            <div className="grid grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                <div key={item} className="min-w-0 text-center">
                  <SkeletonBlock className="mx-auto h-12 w-12 rounded-2xl bg-sky-50" />
                  <SkeletonBlock className="mx-auto mt-2 h-3 w-10 bg-slate-200" />
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[22px] bg-[#168AF2] shadow-[0_16px_34px_rgba(22,138,242,0.12)]">
            <SkeletonBlock className="aspect-[3/1] w-full rounded-[18px] bg-sky-100/70" />
          </section>

          <section className="rounded-[22px] bg-white px-4 py-4 shadow-[0_14px_34px_rgba(22,138,242,0.09)] ring-1 ring-sky-950/[0.04]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <SkeletonBlock className="h-6 w-40 bg-slate-200" />
              <SkeletonBlock className="h-4 w-20 bg-sky-100" />
            </div>
            <div className="divide-y divide-slate-100">
              {[0, 1].map((item) => (
                <div key={item} className="flex items-center gap-3 py-3">
                  <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full bg-sky-100" />
                  <div className="min-w-0 flex-1">
                    <SkeletonBlock className="h-4 w-40 bg-slate-200" />
                    <SkeletonBlock className="mt-2 h-3 w-32 bg-slate-100" />
                  </div>
                  <SkeletonBlock className="h-8 w-16 rounded-full bg-sky-50" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto w-full bg-white px-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
          <div className="grid h-[70px] grid-cols-5 items-stretch rounded-t-[24px] border border-sky-950/[0.06] bg-white/96 px-2 pt-2 shadow-[0_-14px_34px_rgba(22,138,242,0.12)]">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="flex flex-col items-center justify-center gap-2">
                <SkeletonBlock className="h-6 w-6 rounded-lg bg-slate-200" />
                <SkeletonBlock className="h-3 w-10 bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type RuangSinyalLoadingScreenProps = {
  persistent?: boolean;
};

export function RuangSinyalLoadingScreen({ persistent = false }: RuangSinyalLoadingScreenProps) {
  const pathname = usePathname();
  const firstRender = useRef(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (persistent) {
      return;
    }

    const first = firstRender.current;
    firstRender.current = false;

    const resetTimer = window.setTimeout(() => setVisible(true), 0);
    const timer = window.setTimeout(() => setVisible(false), first ? 760 : 420);
    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(timer);
    };
  }, [pathname, persistent]);

  if (!persistent && !visible) return null;

  if (pathname.startsWith("/user")) return <UserSkeletonScreen />;
  if (pathname.startsWith("/dashboard")) return <DashboardSkeletonScreen />;
  return <SiteSkeletonScreen />;
}
