import Image from "next/image";

type BrandLogoProps = {
  variant?: "light" | "dark";
};

export function BrandLogo({ variant = "light" }: BrandLogoProps) {
  const isDark = variant === "dark";
  return (
    <div
      className={`inline-flex max-w-full items-center justify-center rounded-lg ${
        isDark
          ? "bg-white px-2.5 py-2 shadow-sm ring-1 ring-sky-100"
          : "px-1 py-1"
      }`}
      aria-label="RuangSinyal"
    >
      <span className="relative block h-11 w-[180px] max-w-full">
        <Image
          src="/images/logo-ruangsinyal.png"
          alt="RuangSinyal"
          fill
          sizes="180px"
          priority
          className="object-contain"
        />
      </span>
    </div>
  );
}

