import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - all reports (admin)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const reports = await db.jobReport.findMany({
      where,
      include: {
        job: { select: { id: true, title: true, status: true } },
        reporter: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("Admin reports error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH - review/dismiss a report (admin)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reportId, action } = await req.json(); // action: review | dismiss
    if (!reportId || !action) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }

    const report = await db.jobReport.findUnique({ where: { id: reportId } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const newStatus = action === "dismiss" ? "DISMISSED" : "REVIEWED";
    await db.jobReport.update({
      where: { id: reportId },
      data: { status: newStatus, reviewedAt: new Date() },
    });

    await db.adminLog.create({
      data: {
        adminId: user.id,
        action: `REPORT_${action.toUpperCase()}`,
        target: reportId,
        detail: `Report ${reportId} ${action}ed`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin report patch error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
