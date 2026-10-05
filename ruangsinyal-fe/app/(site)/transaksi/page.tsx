import { getAppServerSession } from "@/lib/server-auth";
import type { UserSession } from "@/components/user/types";
import { GuestBottomNav } from "@/components/guest/GuestBottomNav";
import { GuestTransactionHistory } from "@/components/guest/GuestTransactionHistory";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

export default async function GuestTransactionsPage() {
  const session = (await getAppServerSession()) as SessionShape | null;
  const isLoggedIn = Boolean(session?.backendToken);

  return (
    <main className="min-h-screen bg-[#EFFBFF] pb-24">
      <div className="px-4 pt-5">
        <GuestTransactionHistory />
      </div>
      <GuestBottomNav isLoggedIn={isLoggedIn} />
    </main>
  );
}
