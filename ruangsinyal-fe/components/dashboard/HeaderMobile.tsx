import { BrandLogo } from "./BrandLogo";
import { Menu } from "lucide-react";

type Props = {
  onOpenMenu: () => void;
};

export function HeaderMobile({ onOpenMenu }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-sky-100 bg-white/95 px-4 py-3 shadow-[0_10px_24px_rgba(22,138,242,0.08)] backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <BrandLogo />
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-[#168AF2] shadow-sm"
          onClick={onOpenMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

