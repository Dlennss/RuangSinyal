"use client";

import Image from "next/image";
import { Phone, Sparkles } from "lucide-react";
import { getBrandLogo } from "@/lib/brand-logos";
import type { UserBrandItem, UserProductItem } from "@/components/user/types";

type PulsaEntryCardProps = {
  phone: string;
  nominalInput: string;
  onPhoneChange: (value: string) => void;
  onNominalChange: (value: string) => void;
  onQuickBuy: () => void;
  buyDisabled: boolean;
  detectedBrand: UserBrandItem | null;
  matchedProduct: UserProductItem | null;
  normalizedPhone: string;
  nominalValue: number;
  formatNominal: (value: number) => string;
  getDisplayedFixedPrice: (item: UserProductItem) => number;
};

export function PulsaEntryCard({
  phone,
  nominalInput,
  onPhoneChange,
  onNominalChange,
  onQuickBuy,
  buyDisabled,
  detectedBrand,
  matchedProduct,
  normalizedPhone,
  nominalValue,
  formatNominal,
  getDisplayedFixedPrice,
}: PulsaEntryCardProps) {
  const detectedLogo = detectedBrand ? getBrandLogo(detectedBrand.nama) : null;

  return (
    <section className="overflow-hidden rounded-[22px] border border-sky-100/80 bg-white shadow-[0_18px_42px_rgba(22,138,242,0.10)]">
      <div className="bg-linear-to-r from-sky-50 via-white to-sky-50 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#e50b18] shadow-[0_10px_22px_rgba(215,7,23,0.14)] ring-1 ring-sky-100">
            <Phone className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-black tracking-tight text-slate-950">Isi Pulsa</h2>
            <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">Nomor terdeteksi otomatis sesuai operator.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="relative">
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 13))}
            minLength={8}
            maxLength={13}
            placeholder="Contoh: 081234567890"
            className={`h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm font-semibold text-slate-900 shadow-[0_8px_22px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-[#e50b18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 ${detectedBrand ? "pr-14" : ""}`}
          />
          <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e50b18]" />
          {detectedBrand ? (
            <div className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center overflow-hidden rounded-xl bg-white">
              {detectedLogo ? (
                <Image src={detectedLogo.src} alt={detectedLogo.alt} width={32} height={32} className="h-full w-full object-contain" />
              ) : (
                <span className="text-[10px] font-black uppercase text-[#e50b18]">{detectedBrand.nama.slice(0, 2)}</span>
              )}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-[1fr_auto] items-stretch gap-2">
          <div className="relative flex-1">
            <input
              type="tel"
              value={nominalInput}
              onChange={(e) => onNominalChange(e.target.value)}
              placeholder="Masukkan nominal pulsa"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm font-semibold text-slate-900 shadow-[0_8px_22px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-[#e50b18] focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
            <Sparkles className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ff8a00]" />
          </div>
          <button
            type="button"
            onClick={onQuickBuy}
            disabled={buyDisabled}
            className="inline-flex h-12 min-w-20 items-center justify-center rounded-2xl bg-linear-to-r from-[#168AF2] to-[#21D5ED] px-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(22,138,242,0.22)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Beli
          </button>
        </div>

      </div>
    </section>
  );
}
