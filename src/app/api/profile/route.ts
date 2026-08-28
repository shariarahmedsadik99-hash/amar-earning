import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { name } = await req.json();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    await db.user.update({
      where: { id: user.id },
      data: { name },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Profile update error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
