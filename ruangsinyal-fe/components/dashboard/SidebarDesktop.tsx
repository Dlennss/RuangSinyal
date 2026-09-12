import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import { NavItem } from "./NavItem";
import { type NavSection } from "./nav";

type Props = {
  sections: NavSection[];
  onLogout: () => void;
  contextLabel?: string;
};

export function SidebarDesktop({ sections, onLogout, contextLabel = "Control Center" }: Props) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  return (
    <aside className="hidden w-72 shrink-0 self-start border-r border-sky-200 bg-[linear-gradient(180deg,#EFFBFF_0%,#C5EDFF_55%,#83D6F5_100%)] md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
      <div className="border-b border-sky-200/80 px-5 py-5">
        <div className="flex justify-center">
          <BrandLogo variant="dark" />
        </div>
        <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-normal text-[#426684]">
          {contextLabel}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {sections.map((section, idx) => {
          const key = section.title || `section-${idx}`;
          const active = section.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
          const isOpen = section.title ? openSections[key] ?? active : true;

          return (
            <div key={key} className={idx === 0 ? "space-y-1" : "mt-5 border-t border-sky-200/80 pt-4"}>
              {section.title ? (
                <button
                  type="button"
                  className={`mb-3 flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-[13px] font-semibold tracking-normal outline-none transition focus-visible:ring-4 focus-visible:ring-sky-200 ${
                    active
                      ? "border-sky-200 bg-white text-[#0876CE] shadow-sm"
                      : "border-transparent bg-transparent text-[#062B74] hover:border-sky-200 hover:bg-white/60"
                  }`}
                  onClick={() => setOpenSections((prev) => ({ ...prev, [key]: !isOpen }))}
                >
                  <span>{section.title}</span>
                  <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180 text-[#168AF2]" : "text-[#426684]"}`} />
                </button>
              ) : null}
              {isOpen ? (
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <NavItem key={item.href} href={item.href} label={item.label} variant="light" />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="border-t border-sky-200/80 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
