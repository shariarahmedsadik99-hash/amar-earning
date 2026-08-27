import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

    const jobs = await db.job.findMany({
      where,
      include: {
        category: true,
        owner: { select: { name: true, username: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ jobs });
  } catch (e) {
    console.error("Admin jobs error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { jobId, action } = await req.json(); // action: approve | reject | pause | activate | delete

    const job = await db.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (action === "delete") {
      await db.job.delete({ where: { id: jobId } });
    } else if (action === "feature" || action === "unfeature") {
      // Toggle featured flag
      await db.job.update({
        where: { id: jobId },
        data: { featured: action === "feature" },
      });
    } else {
      const newStatus =
        action === "approve" ? "ACTIVE" :
        action === "reject" ? "REJECTED" :
        action === "pause" ? "PAUSED" :
        action === "activate" ? "ACTIVE" : job.status;
      await db.job.update({ where: { id: jobId }, data: { status: newStatus } });

      // Notify owner
      await db.notification.create({
        data: {
          userId: job.ownerId,
          title: action === "approve" ? "কাজ অনুমোদিত" : action === "reject" ? "কাজ প্রত্যাখ্যাত" : "কাজ আপডেট",
          message: `আপনার "${job.title}" কাজের স্ট্যাটাস আপডেট হয়েছে: ${newStatus}`,
          type: "ANNOUNCEMENT",
        },
      });
    }

    await db.adminLog.create({
      data: {
        adminId: user.id,
        action: action.toUpperCase(),
        target: jobId,
        detail: `Job "${job.title}" ${action}d`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin job patch error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
