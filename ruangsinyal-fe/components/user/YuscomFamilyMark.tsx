import Image from "next/image";
import { getYuscomFamilyVisual } from "@/lib/yuscom-family-visuals";

const badgeToneClass: Record<string, string> = {
  sky: "border-sky-100 bg-[#EFFBFF] text-[#168AF2]",
  emerald: "border-sky-100 bg-sky-50 text-sky-700",
  violet: "border-violet-100 bg-violet-50 text-violet-700",
  rose: "border-sky-100 bg-sky-50 text-sky-700",
  amber: "border-cyan-100 bg-cyan-50 text-cyan-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

type Props = {
  family: string;
  size?: number;
};

export function YuscomFamilyMark({ family, size = 56 }: Props) {
  const visual = getYuscomFamilyVisual(family);
  const normalizedFamily = family.trim().toUpperCase();
  const isSmartfren = normalizedFamily === "SMARTFREN";

  if (visual.kind === "image") {
    return (
      <div
        className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm ${
          isSmartfren ? "p-1.5" : "p-2"
        }`}
        style={{ width: size, height: size }}
        title={visual.alt}
      >
        <Image
          src={visual.src}
          alt={visual.alt}
          width={size - 12}
          height={size - 12}
          className={`h-full w-full object-contain ${isSmartfren ? "scale-110" : ""}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl border p-2 shadow-sm ${badgeToneClass[visual.tone]}`}
      style={{ width: size, height: size }}
      title={family}
    >
      <span className="text-center text-[11px] font-black uppercase leading-tight tracking-tight">
        {visual.label}
      </span>
    </div>
  );
}
