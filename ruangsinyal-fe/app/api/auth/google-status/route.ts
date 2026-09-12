import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasValue(value: string | undefined) {
  return Boolean((value || "").trim());
}

export function GET() {
  const clientID = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET;
  const enabled = String(process.env.GOOGLE_LOGIN_ENABLED ?? "true").toLowerCase() === "true";

  return NextResponse.json({
    ok: true,
    enabled,
    configured: enabled && hasValue(clientID) && hasValue(clientSecret),
    hasClientID: hasValue(clientID),
    hasClientSecret: hasValue(clientSecret),
  });
}
