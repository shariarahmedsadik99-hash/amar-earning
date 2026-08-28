import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST - report a job
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, reason, detail } = await req.json();
    if (!jobId || !reason) {
      return NextResponse.json({ error: "jobId and reason required" }, { status: 400 });
    }

    const validReasons = ["spam", "inappropriate", "scam", "duplicate", "other"];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }

    const job = await db.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Cannot report own job
    if (job.ownerId === user.id) {
      return NextResponse.json({ error: "Cannot report your own job" }, { status: 400 });
    }

    // Check if already reported
    const existing = await db.jobReport.findUnique({
      where: { jobId_reporterId: { jobId, reporterId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "You already reported this job" }, { status: 400 });
    }

    const report = await db.jobReport.create({
      data: {
        jobId,
        reporterId: user.id,
        reason,
        detail: detail || null,
        status: "PENDING",
      },
    });

    // Notify admins
    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "নতুন রিপোর্ট",
          message: `"${job.title}" কাজটি রিপোর্ট করা হয়েছে। কারণ: ${reason}`,
          type: "ANNOUNCEMENT",
        },
      });
    }

    return NextResponse.json({ ok: true, report });
  } catch (e) {
    console.error("Report create error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET - check if current user reported a job
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ reported: false });
    }
    const { jobId } = await req.json();
    const existing = await db.jobReport.findUnique({
      where: { jobId_reporterId: { jobId, reporterId: user.id } },
    });
    return NextResponse.json({ reported: !!existing });
  } catch {
    return NextResponse.json({ reported: false });
  }
}
