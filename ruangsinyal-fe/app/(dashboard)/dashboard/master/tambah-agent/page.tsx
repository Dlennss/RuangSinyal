import { UserPlus, UsersRound, WalletCards } from "lucide-react";
import { MasterCreateAgentForm } from "@/components/dashboard/MasterCreateAgentForm";

export default function MasterTambahAgentPage() {
  return (
    <main className="-m-2 min-h-screen bg-[#EFFBFF] p-3 text-slate-950 sm:p-5 lg:p-7">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_88%_8%,rgba(255,196,0,0.36),transparent_30%),linear-gradient(135deg,#168AF2_0%,#168AF2_54%,#21D5ED_118%)] text-white shadow-[0_18px_42px_rgba(22,138,242,0.22)]">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#168AF2] shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
                <UserPlus className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">Marketing Agent</p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">Tambah Agent Baru</h1>
                <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-white/82 sm:text-sm">
                  Buat akun agent retail RuangSinyal dengan data login, kontak, dan nama konter yang siap dipakai.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-[320px]">
              <div className="rounded-2xl bg-white/14 p-4 ring-1 ring-white/20">
                <UsersRound className="h-5 w-5 text-cyan-100" />
                <p className="mt-2 text-lg font-black">Agent</p>
                <p className="mt-1 text-[11px] font-semibold text-white/75">Role otomatis</p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-[#168AF2] shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
                <WalletCards className="h-5 w-5" />
                <p className="mt-2 text-lg font-black">Start</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">Level awal</p>
              </div>
            </div>
          </div>
        </div>

        <MasterCreateAgentForm useRetailEndpoint />
      </section>
    </main>
  );
}
