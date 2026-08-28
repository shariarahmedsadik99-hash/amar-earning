import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.id, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (e) {
    console.error("Notifications error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body; // "readAll" | "read"

    if (action === "readAll") {
      await db.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Notifications update error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
