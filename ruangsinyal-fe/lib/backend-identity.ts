export type BackendIdentity = {
  member_id: number;
  role: string;
  nama: string;
  email: string;
};

export async function getBackendIdentity(token: string): Promise<BackendIdentity | null> {
  if (!token) return null;
  const base = (process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8080").replace(/\/+$/, "");
  try {
    const response = await fetch(`${base}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return null;
    const me = data as Record<string, unknown>;
    if (me.ok !== true || me.aktif !== true || typeof me.member_id !== "number" || me.member_id <= 0 || typeof me.role !== "string" || !me.role.trim()) return null;
    return {
      member_id: me.member_id,
      role: me.role.trim().toLowerCase(),
      nama: typeof me.nama === "string" ? me.nama : "",
      email: typeof me.email === "string" ? me.email : "",
    };
  } catch {
    return null;
  }
}
