import Link from "next/link";

type UserTransactionPaginationProps = {
  status: string;
  page: number;
  hasNextPage: boolean;
  mode?: "default" | "manual-first";
  onNext?: () => void | Promise<void>;
};

function buildHref(status: string, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/user/transaksi${qs ? `?${qs}` : ""}`;
}

export function UserTransactionPagination({
  status,
  page,
  hasNextPage,
  mode = "default",
  onNext,
}: UserTransactionPaginationProps) {
  if (!hasNextPage) {
    return null;
  }

  return (
    <div className="flex justify-center">
      {mode === "manual-first" && page === 1 ? (
        <button
          type="button"
          onClick={() => void onNext?.()}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#0876CE] px-4 py-2 text-sm font-semibold text-white! shadow-sm transition hover:bg-[#0665B2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          Muat transaksi lainnya
        </button>
      ) : (
        <Link
          href={buildHref(status, page + 1)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#0876CE] px-4 py-2 text-sm font-semibold text-white! visited:text-white! shadow-sm transition hover:bg-[#0665B2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          Muat transaksi lainnya
        </Link>
      )}
    </div>
  );
}
