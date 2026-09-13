'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trash2, Loader2, RefreshCw } from 'lucide-react';
import { TransactionHistoryControls } from '@/components/shared/TransactionHistoryControls';
import { TransactionHistoryEmpty } from '@/components/shared/TransactionHistoryEmpty';
import { TransactionHistoryRow } from '@/components/shared/TransactionHistoryRow';
import {
  loadGuestTransactions,
  saveGuestTransaction,
  removeGuestTransaction,
  type GuestTransactionEntry,
} from '@/lib/guest-transaction-storage';
import { getOrderByInvoice } from '@/lib/api.transactions';

type SyncedGuestOrder = {
  invoice_id?: string;
  dest?: string;
  produk_nama_snapshot?: string;
  dibuat_pada?: string;
  diubah_pada?: string;
  status?: string;
  harga_final?: number;
  sn?: string;
};

export function GuestTransactionHistory() {
  const [entries, setEntries] = useState<GuestTransactionEntry[]>([]);
  const [selectedRange, setSelectedRange] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const load = useCallback(() => {
    setEntries(loadGuestTransactions());
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncWithServer = useCallback(async () => {
    const current = loadGuestTransactions();
    if (current.length === 0) return;
    setIsSyncing(true);
    try {
      const toSync = current.filter((e) => e.guest_email && e.guest_phone).slice(0, 10);
      for (const entry of toSync) {
        try {
          const res = await getOrderByInvoice(entry.invoice_id, undefined, entry.guest_email, entry.guest_phone);
          const data = (Array.isArray(res) ? res[0] : res) as SyncedGuestOrder | undefined;
          if (data && data.invoice_id) {
            saveGuestTransaction({
              invoice_id: data.invoice_id,
              guest_email: entry.guest_email,
              guest_phone: entry.guest_phone,
              dest: data.dest || entry.dest,
              title: data.produk_nama_snapshot || entry.title,
              created_at: data.dibuat_pada || entry.created_at,
              updated_at: data.diubah_pada || data.dibuat_pada || entry.updated_at,
              status: data.status || entry.status,
              amount: Number(data.harga_final || 0) > 0 ? Number(data.harga_final || 0) : entry.amount,
              serial_number: data.sn || entry.serial_number,
            });
          }
        } catch { /* skip */ }
      }
    } finally {
      setIsSyncing(false);
      load();
    }
  }, [load]);

  useEffect(() => { syncWithServer(); }, [syncWithServer]);

  const handleDelete = (invoiceId: string) => {
    removeGuestTransaction(invoiceId);
    load();
  };

  const filteredEntries = entries.filter((entry) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const haystack = [entry.invoice_id, entry.dest, entry.title, entry.status].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    const dateValue = entry.updated_at || entry.created_at;
    const date = dateValue ? new Date(dateValue) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return selectedRange === 'Semua' && !selectedDate;
    }

    if (selectedDate) {
      const [year, month, day] = selectedDate.split("-").map(Number);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (selectedRange === 'Hari ini') return sameDay(date, today);
    if (selectedRange === 'Kemarin') return sameDay(date, yesterday);
    if (selectedRange === '7 Hari') return date >= sevenDaysAgo;
    return true;
  });

  function resetFilters() { setSearchQuery(""); setSelectedRange("Semua"); setSelectedDate(""); }
  const hasFilters = Boolean(searchQuery.trim() || selectedDate || selectedRange !== "Semua");

  return (
    <div className="space-y-4">
      <TransactionHistoryControls query={searchQuery} range={selectedRange} date={selectedDate} onQueryChange={setSearchQuery}
        onRangeChange={(value) => { setSelectedRange(value); setSelectedDate(""); }}
        onDateChange={(value) => { setSelectedDate(value); setSelectedRange("Semua"); }} onReset={resetFilters} />
      {isSyncing ? <div role="status" className="flex items-center gap-2 text-xs text-sky-700"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Memperbarui status...</div> : null}
      {isLoading ? (
        <div role="status" className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-sky-600" /> Memuat transaksi...</div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 text-xs">
            <h2 className="font-semibold text-slate-700">Daftar transaksi</h2>
            <span className="tabular-nums text-slate-500">{filteredEntries.length} transaksi</span>
          </div>
          {filteredEntries.length === 0 ? <TransactionHistoryEmpty filtered={hasFilters} onReset={resetFilters} servicesHref="/kategori" /> : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <TransactionHistoryRow key={entry.invoice_id}
                  href={`/transaksi/${encodeURIComponent(entry.invoice_id)}?${new URLSearchParams({ guest_email: entry.guest_email, guest_phone: entry.guest_phone })}`}
                  title={entry.title} invoiceId={entry.invoice_id} destination={entry.dest} amount={entry.amount} date={entry.updated_at || entry.created_at} status={entry.status}
                  action={<button type="button" onClick={() => handleDelete(entry.invoice_id)} aria-label={`Hapus riwayat ${entry.invoice_id}`} title="Hapus dari riwayat perangkat" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-sky-500"><Trash2 className="h-4 w-4" /></button>} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
