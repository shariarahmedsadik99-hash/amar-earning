import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - owner reputation stats for a job owner
export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
        wallet: { select: { totalSpent: true } },
        _count: { select: { jobs: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all submissions on this owner's jobs to compute approval rate
    const ownerJobs = await db.job.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const jobIds = ownerJobs.map((j) => j.id);

    const submissions = await db.jobSubmission.findMany({
      where: { jobId: { in: jobIds } },
      select: { status: true },
    });

    const approved = submissions.filter((s) => s.status === "APPROVED").length;
    const rejected = submissions.filter((s) => s.status === "REJECTED").length;
    const reviewed = approved + rejected;
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;

    return NextResponse.json({
      name: user.name,
      username: user.username,
      memberSince: user.createdAt,
      jobsPosted: user._count.jobs,
      totalSpent: user.wallet?.totalSpent || 0,
      approvalRate,
      isVerified: user._count.jobs >= 3, // verified if posted 3+ jobs
    });
  } catch (e) {
    console.error("Owner reputation error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
