import { getAppServerSession } from "@/lib/server-auth";
import { getProductsByBrand } from "@/lib/api.products";
import type { UserSession } from "@/components/user/types";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { UserAuthClientSync } from "@/components/user/UserAuthClientSync";
import { UserProductGrid } from "@/components/user/UserProductGrid";
import { EMoneyBrandFlow } from "@/components/shared/EMoneyBrandFlow";
import { GuestPulsaQuickOrder } from "@/components/guest/GuestPulsaQuickOrder";
import { GuestPaketDataQuickOrder } from "@/components/guest/GuestPaketDataQuickOrder";
import { RetailBillingEntryFlow } from "@/components/shared/RetailBillingEntryFlow";
import { catalogServiceKind, catalogBillingPlaceholder } from "@/lib/catalog-service";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

type PageProps = {
  params: Promise<{ id: string; brandId: string }>;
};

export default async function UserBrandProductsPage({ params }: PageProps) {
  const session = (await getAppServerSession()) as SessionShape | null;
  const user = session?.user ?? null;
  const backendToken = session?.backendToken;
  const isLoggedIn = Boolean(backendToken);
  const buyerRole = String(user?.role || "").trim().toLowerCase();

  const [{ id, brandId }] = await Promise.all([params]);
  const products = await getProductsByBrand(id, brandId);
  const brand = products[0]?.brand_nama || "Brand";
  const categoryName = products[0]?.kategori_nama || "";
  const serviceKind = catalogServiceKind(categoryName);
  const isBillingCategory = serviceKind === "billing" || serviceKind === "bpjs";
  const billingPlaceholder = catalogBillingPlaceholder(categoryName);
  const billingDescription = `Masukkan data pelanggan ${brand} terlebih dulu sebelum memilih produk pembayaran.`;

  return (
    <main className="min-h-screen bg-[#EFFBFF]">
      {backendToken ? <UserAuthClientSync backendToken={backendToken} /> : null}
      <div className="space-y-4 px-4">
        <section>
          {products.length === 0 ? (
            <div className="grid min-h-40 place-items-center rounded-3xl border border-dashed border-slate-200 bg-white px-4 text-center text-sm text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.13)]">
              Belum ada produk aktif untuk brand ini.
            </div>
          ) : serviceKind === "data" ? (
            <GuestPaketDataQuickOrder
              kategoriId={String(id)}
              brands={[]}
              authToken={backendToken}
              buyerRole={buyerRole}
              forcedBrand={{ id: Number(brandId), nama: brand, aktif: true }}
              brandHrefPrefix="/user/kategori"
            />
          ) : serviceKind === "wallet" ? (
            <EMoneyBrandFlow items={products} isLoggedIn={isLoggedIn} authToken={backendToken} mode="user" buyerRole={buyerRole} />
          ) : serviceKind === "pulsa" ? (
            <GuestPulsaQuickOrder
              kategoriId={String(id)}
              brands={[]}
              authToken={backendToken}
              buyerRole={buyerRole}
              forcedBrand={{ id: Number(brandId), nama: brand, aktif: true }}
            />
          ) : isBillingCategory ? (
            <RetailBillingEntryFlow
              title={categoryName || brand}
              description={billingDescription}
              placeholder={billingPlaceholder}
              items={products}
              mode="user"
              authToken={backendToken}
              buyerRole={buyerRole}
            />
          ) : (
            <UserProductGrid items={products} isLoggedIn={isLoggedIn} authToken={backendToken} buyerRole={buyerRole} />
          )}
        </section>
      </div>

      <UserBottomNav />
    </main>
  );
}
