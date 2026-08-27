import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const DEFAULT_SETTINGS = {
  submissionApproved: true,
  submissionRejected: true,
  withdrawalApproved: true,
  withdrawalRejected: true,
  jobCompleted: true,
  announcement: true,
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { notifySettings: true },
    });

    let settings = DEFAULT_SETTINGS;
    if (fullUser?.notifySettings) {
      try {
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(fullUser.notifySettings) };
      } catch {}
    }

    return NextResponse.json({ settings });
  } catch (e) {
    console.error("Notification settings GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { settings } = body;

    // Merge with defaults to ensure all keys exist
    const merged = { ...DEFAULT_SETTINGS, ...settings };

    await db.user.update({
      where: { id: user.id },
      data: { notifySettings: JSON.stringify(merged) },
    });

    return NextResponse.json({ ok: true, settings: merged });
  } catch (e) {
    console.error("Notification settings PATCH error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
