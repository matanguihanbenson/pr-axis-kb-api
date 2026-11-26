import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
