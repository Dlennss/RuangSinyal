import type { UserCategoryItem } from "@/components/user/types";

export function getGuestCategoryPath(item: Pick<UserCategoryItem, "id" | "nama">) {
  // IDs are assigned by the local database, not fixed by the upstream catalog.
  return `/kategori/${item.id}?name=${encodeURIComponent(item.nama)}`;
}
