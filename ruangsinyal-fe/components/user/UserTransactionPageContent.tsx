"use client";

import { useState } from "react";
import type { UserAppOrder } from "@/components/user/types";
import { UserTransactionHistoryList } from "@/components/user/UserTransactionHistoryList";
import { TransactionHistoryControls } from "@/components/shared/TransactionHistoryControls";

type Props = { initialItems: UserAppOrder[]; initialHasNextPage: boolean; status: string; authToken: string };

export function UserTransactionPageContent({ initialItems, initialHasNextPage, status, authToken }: Props) {
  const [query, setQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState("");
  function resetFilters() { setQuery(""); setSelectedRange("Semua"); setSelectedDate(""); }
  return (
    <section className="space-y-4">
      <TransactionHistoryControls query={query} range={selectedRange} date={selectedDate} onQueryChange={setQuery}
        onRangeChange={(value) => { setSelectedRange(value); setSelectedDate(""); }}
        onDateChange={(value) => { setSelectedDate(value); setSelectedRange("Semua"); }} onReset={resetFilters} />
      <UserTransactionHistoryList initialItems={initialItems} initialHasNextPage={initialHasNextPage} status={status} authToken={authToken}
        searchQuery={query} selectedRange={selectedRange} selectedDate={selectedDate} onResetFilters={resetFilters} />
    </section>
  );
}
