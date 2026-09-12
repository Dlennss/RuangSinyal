import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{
    member_id?: string;
    tab?: string;
  }>;
};

export default async function LegacyAdminMembersHistoryPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const qs = new URLSearchParams();
  if (resolvedSearchParams?.member_id) qs.set("member_id", resolvedSearchParams.member_id);
  if (resolvedSearchParams?.tab) qs.set("tab", resolvedSearchParams.tab);

  const suffix = qs.toString();
  redirect(`/dashboard/admin/master/members/history${suffix ? `?${suffix}` : ""}`);
}
