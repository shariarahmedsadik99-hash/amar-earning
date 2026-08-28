import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST - admin broadcasts an announcement to ALL users
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, message } = await req.json();
    if (!title || !message) {
      return NextResponse.json({ error: "Title and message required" }, { status: 400 });
    }

    // Get all active users with their notification settings
    const users = await db.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, notifySettings: true },
    });

    // Filter out users who disabled announcements
    const eligibleUsers = users.filter((u) => {
      if (!u.notifySettings) return true; // default: enabled
      try {
        const settings = JSON.parse(u.notifySettings);
        return settings.announcement !== false;
      } catch {
        return true;
      }
    });

    // Create notifications for eligible users in a batch
    await db.notification.createMany({
      data: eligibleUsers.map((u) => ({
        userId: u.id,
        title,
        message,
        type: "ANNOUNCEMENT",
      })),
    });

    await db.adminLog.create({
      data: {
        adminId: user.id,
        action: "ANNOUNCE",
        target: "ALL_USERS",
        detail: `${title}: ${message.slice(0, 100)}`,
      },
    });

    return NextResponse.json({ ok: true, recipients: eligibleUsers.length });
  } catch (e) {
    console.error("Announce error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
