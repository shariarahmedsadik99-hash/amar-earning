import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - job stats: completion rate, total submissions, approved count, etc.
export async function GET(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const job = await db.job.findUnique({
      where: { id },
      select: {
        id: true,
        reward: true,
        workerLimit: true,
        completedCount: true,
        createdAt: true,
        deadline: true,
        ownerId: true,
        _count: { select: { submissions: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const submissions = await db.jobSubmission.findMany({
      where: { jobId: id },
      select: { status: true, createdAt: true, reviewedAt: true },
    });

    const total = submissions.length;
    const approved = submissions.filter((s) => s.status === "APPROVED").length;
    const rejected = submissions.filter((s) => s.status === "REJECTED").length;
    const pending = submissions.filter((s) => s.status === "PENDING").length;

    // Approval rate = approved / (approved + rejected)
    const reviewed = approved + rejected;
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;

    // Completion rate = completedCount / workerLimit
    const completionRate =
      job.workerLimit > 0
        ? Math.round((job.completedCount / job.workerLimit) * 100)
        : 0;

    // Average approval time (hours) from submissions that have been reviewed
    const reviewedSubs = submissions.filter((s) => s.reviewedAt && s.status === "APPROVED");
    let avgApprovalHours = 0;
    if (reviewedSubs.length > 0) {
      const totalHours = reviewedSubs.reduce((sum, s) => {
        const diff = new Date(s.reviewedAt!).getTime() - new Date(s.createdAt).getTime();
        return sum + diff / (1000 * 60 * 60);
      }, 0);
      avgApprovalHours = Math.round((totalHours / reviewedSubs.length) * 10) / 10;
    }

    // Total paid out for this job
    const totalPaidOut = approved * job.reward;

    // Days remaining until deadline
    const now = new Date();
    const deadlineDate = new Date(job.deadline);
    const daysRemaining = Math.max(
      0,
      Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    return NextResponse.json({
      totalSubmissions: total,
      approved,
      rejected,
      pending,
      approvalRate,
      completionRate,
      avgApprovalHours,
      totalPaidOut,
      daysRemaining,
      slotsRemaining: job.workerLimit - job.completedCount,
    });
  } catch (e) {
    console.error("Job stats error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
