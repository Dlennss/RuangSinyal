"use client";

import * as React from "react";

type QuickProductOptionItem = {
  id: number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
};

type QuickProductOptionGridProps = {
  items: QuickProductOptionItem[];
  selectedId?: number | null;
  onSelect: (id: number) => void;
  columns?: 1 | 2;
  variant?: "default" | "pulsa";
};

export function QuickProductOptionGrid({
  items,
  selectedId,
  onSelect,
  columns = 2,
  variant = "default",
}: QuickProductOptionGridProps) {
  if (columns === 1) {
    return (
      <div className="space-y-2">
        {items.map((item) => {
          const selected = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`relative w-full overflow-hidden rounded-2xl px-5 py-3 text-left ${
                selected
                  ? "bg-linear-to-br from-[#168AF2] to-[#21D5ED] shadow-[0_18px_36px_rgba(215,7,23,0.26)]"
                  : "bg-linear-to-br from-[#ef1b18] to-[#ff8a00] shadow-[0_14px_30px_rgba(215,7,23,0.18)]"
              }`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-white/20" />

              <div className="relative flex min-h-18 flex-col justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white **:text-inherit text-lg font-semibold">{item.title}</div>
                </div>
                <div className="min-w-0">
                  {item.subtitle ? <div className="text-sm font-semibold leading-none tracking-tight text-white/72">{item.subtitle}</div> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const selected = selectedId === item.id;
        const isPulsaCard = variant === "pulsa";
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`relative overflow-hidden rounded-2xl px-4 py-4 ${
              selected
                ? "bg-linear-to-br from-[#168AF2] to-[#21D5ED] shadow-[0_18px_36px_rgba(215,7,23,0.26)]"
                : "bg-linear-to-br from-[#ef1b18] to-[#ff8a00] shadow-[0_14px_30px_rgba(215,7,23,0.18)]"
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-white/20" />

            <div
              className={`relative ${
                isPulsaCard
                  ? "flex min-h-18 flex-col justify-between"
                  : "flex min-h-20 flex-col justify-between gap-4"
              }`}
            >
              <div
                className={`min-w-0 text-white **:text-inherit ${
                  isPulsaCard ? "flex flex-1 items-center justify-center text-center text-sm font-semibold" : "text-sm font-semibold"
                }`}
              >
                {item.title}
              </div>
              {item.subtitle ? (
                <div
                  className={`font-bold leading-none tracking-tight text-white ${
                    isPulsaCard ? "text-right text-[11px] opacity-65" : "text-sm opacity-80"
                  }`}
                >
                  {item.subtitle}
                </div>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
