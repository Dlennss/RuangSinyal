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
              aria-pressed={selected}
              className={`relative w-full overflow-hidden rounded-lg px-5 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                selected
                  ? "bg-linear-to-br from-[#0751A2] to-[#1268C4] ring-2 ring-sky-300 shadow-[0_4px_12px_rgba(22,138,242,0.18)]"
                  : "bg-linear-to-br from-[#1268C4] to-[#0872D6] shadow-[0_3px_10px_rgba(22,138,242,0.12)] hover:from-[#0751A2]"
              }`}
            >

              <div className="relative flex min-h-18 flex-col justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white **:text-inherit text-lg font-semibold">{item.title}</div>
                </div>
                <div className="min-w-0">
                  {item.subtitle ? <div className="text-sm font-semibold leading-snug text-white">{item.subtitle}</div> : null}
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
            aria-pressed={selected}
            className={`relative overflow-hidden rounded-lg px-4 py-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
              selected
                ? "bg-linear-to-br from-[#0751A2] to-[#1268C4] ring-2 ring-sky-300 shadow-[0_4px_12px_rgba(22,138,242,0.18)]"
                : "bg-linear-to-br from-[#1268C4] to-[#0872D6] shadow-[0_3px_10px_rgba(22,138,242,0.12)] hover:from-[#0751A2]"
            }`}
          >

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
                  className={`font-bold leading-snug text-white ${
                    isPulsaCard ? "text-right text-xs" : "text-sm"
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
