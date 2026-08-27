import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - public user profile (no auth required)
export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    const username = new URL(req.url).searchParams.get("username");

    if (!userId && !username) {
      return NextResponse.json({ error: "userId or username required" }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: userId ? { id: userId } : { username: username! },
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
        role: true,
        wallet: { select: { totalEarned: true, totalSpent: true } },
        _count: { select: { jobs: true, submissions: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Compute badges (same logic as /api/user-badges but public)
    const submissions = await db.jobSubmission.findMany({
      where: { userId: user.id },
      select: { status: true },
    });
    const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
    const totalEarned = user.wallet?.totalEarned || 0;
    const jobsPosted = user._count.jobs;

    type Badge = { key: string; labelBn: string; labelEn: string; icon: string; earned: boolean };
    const badges: Badge[] = [
      { key: "newbie", labelBn: "নবাগত", labelEn: "Newbie", icon: "Sparkles", earned: true },
      { key: "first_job", labelBn: "প্রথম কাজ", labelEn: "First Job", icon: "CheckCircle2", earned: approvedCount >= 1 },
      { key: "active_worker", labelBn: "সক্রিয় কর্মী", labelEn: "Active Worker", icon: "Zap", earned: approvedCount >= 5 },
      { key: "pro_earner", labelBn: "প্রো আর্নার", labelEn: "Pro Earner", icon: "Crown", earned: totalEarned >= 500 },
      { key: "top_earner", labelBn: "টপ আর্নার", labelEn: "Top Earner", icon: "Trophy", earned: totalEarned >= 1000 },
      { key: "job_creator", labelBn: "কাজ প্রদানকারী", labelEn: "Job Creator", icon: "Briefcase", earned: jobsPosted >= 1 },
      { key: "employer", labelBn: "নিয়োগকর্তা", labelEn: "Employer", icon: "Building2", earned: jobsPosted >= 5 },
      { key: "veteran", labelBn: "অভিজ্ঞ", labelEn: "Veteran", icon: "Award", earned: approvedCount >= 20 },
    ];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        createdAt: user.createdAt,
        role: user.role,
        totalEarned: user.wallet?.totalEarned || 0,
        totalSpent: user.wallet?.totalSpent || 0,
        jobsPosted: user._count.jobs,
        submissionsCount: user._count.submissions,
        approvedCount,
      },
      badges,
    });
  } catch (e) {
    console.error("Public user error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
