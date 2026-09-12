import { ChevronDown, LogOut, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import { NavItem } from "./NavItem";
import { type NavSection } from "./nav";

type Props = {
  sections: NavSection[];
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  contextLabel?: string;
};

export function SidebarMobile({ sections, open, onClose, onLogout, contextLabel = "Control Center" }: Props) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden" onClick={onClose}>
      <aside
        className="flex h-full w-72 flex-col border-r border-sky-950/20 bg-[radial-gradient(circle_at_20%_0%,rgba(255,204,0,0.22),transparent_30%),linear-gradient(180deg,#8f0614_0%,#168AF2_50%,#21D5ED_120%)] p-4 shadow-[0_24px_60px_rgba(22,138,242,0.20)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <BrandLogo variant="dark" />
            <p className="mt-2 text-center text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100">{contextLabel}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 bg-white text-[#168AF2]"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {sections.map((section, idx) => {
            const key = section.title || `section-${idx}`;
            const active = section.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
            const isOpen = section.title ? openSections[key] ?? active : true;

            return (
              <div key={key} className={idx === 0 ? "space-y-1" : "mt-5 border-t border-white/15 pt-4"}>
                {section.title ? (
                  <button
                    type="button"
                    className={`mb-3 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-[13px] font-black uppercase tracking-[0.10em] outline-none transition focus-visible:ring-4 focus-visible:ring-sky-200 ${
                      active
                        ? "border-white bg-white text-[#168AF2] shadow-[0_14px_28px_rgba(0,0,0,0.16)]"
                        : "border-white/15 bg-white/10 text-white hover:border-white/35 hover:bg-white/20 hover:text-white"
                    }`}
                    onClick={() => setOpenSections((prev) => ({ ...prev, [key]: !isOpen }))}
                  >
                    <span>{section.title}</span>
                    <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180 text-[#168AF2]" : "text-cyan-100"}`} />
                  </button>
                ) : null}
                {isOpen ? (
                  <div className="space-y-1.5 rounded-[24px] border border-white/10 bg-[#740511]/25 p-2 shadow-inner shadow-black/5">
                    {section.items.map((item) => (
                      <NavItem key={item.href} href={item.href} label={item.label} onClick={onClose} variant="dark" />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 border-t border-white/15 pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white px-3 py-2.5 text-sm font-black text-sky-700 transition hover:bg-sky-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </div>
  );
}
