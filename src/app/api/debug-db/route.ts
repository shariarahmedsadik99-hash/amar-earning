import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { db } = await import("@/lib/db");
    const count = await db.user.count();
    return NextResponse.json({ ok: true, userCount: count });
  } catch (e) {
    return NextResponse.json({ 
      ok: false, 
      error: e.message,
      stack: e.stack?.split('\n').slice(0, 5).join('\n')
    }, { status: 500 });
  }
}
