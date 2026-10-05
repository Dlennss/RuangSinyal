import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth";
import { cache } from "react";
import { getBackendIdentity } from "@/lib/backend-identity";
import type { UserSession } from "@/components/user/types";

export type AppServerSession = {
  user?: UserSession;
  backendToken?: string;
};

export const PK_AUTH_COOKIE = "pk_auth_token";

export const getAppServerSession = cache(async (): Promise<AppServerSession | null> => {
  const token = (await cookies()).get(PK_AUTH_COOKIE)?.value || "";
  if (token) {
    const identity = await getBackendIdentity(token);
    if (!identity) return null;
    return {
      backendToken: token,
      user: {
        name: identity.nama,
        email: identity.email,
        role: identity.role,
      },
    };
  }

  // Login tetap harus dapat dibuka walau konfigurasi NextAuth di server belum lengkap
  // atau cookie sesi lama sudah tidak lagi dapat dibaca.
  try {
    const session = (await getServerSession(authOptions)) as AppServerSession | null;
    if (!session?.backendToken) return null;
    const identity = await getBackendIdentity(session.backendToken);
    return identity ? {
      backendToken: session.backendToken,
      user: { ...session.user, name: identity.nama, email: identity.email, role: identity.role },
    } : null;
  } catch (error) {
    console.error("[auth] gagal membaca sesi NextAuth", error);
    return null;
  }
});

export async function getBackendAuthorization(req?: Request): Promise<string> {
  const session = await getAppServerSession();
  if (session?.backendToken) return `Bearer ${session.backendToken}`;

  return String(req?.headers.get("authorization") || "").trim();
}
