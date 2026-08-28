import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - achievements progress for current user (progress to next badge)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallet = await db.wallet.findUnique({ where: { userId: user.id } });
    const submissions = await db.jobSubmission.findMany({
      where: { userId: user.id },
      select: { status: true },
    });
    const jobsPosted = await db.job.count({ where: { ownerId: user.id } });

    const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
    const totalEarned = wallet?.totalEarned || 0;

    type BadgeProgress = {
      key: string;
      labelBn: string;
      labelEn: string;
      icon: string;
      earned: boolean;
      current: number;
      target: number;
      unit: string;
    };

    const badges: BadgeProgress[] = [
      {
        key: "newbie",
        labelBn: "নবাগত",
        labelEn: "Newbie",
        icon: "Sparkles",
        earned: true,
        current: 1,
        target: 1,
        unit: "",
      },
      {
        key: "first_job",
        labelBn: "প্রথম কাজ",
        labelEn: "First Job",
        icon: "CheckCircle2",
        earned: approvedCount >= 1,
        current: Math.min(approvedCount, 1),
        target: 1,
        unit: "কাজ",
      },
      {
        key: "active_worker",
        labelBn: "সক্রিয় কর্মী",
        labelEn: "Active Worker",
        icon: "Zap",
        earned: approvedCount >= 5,
        current: Math.min(approvedCount, 5),
        target: 5,
        unit: "কাজ",
      },
      {
        key: "pro_earner",
        labelBn: "প্রো আর্নার",
        labelEn: "Pro Earner",
        icon: "Crown",
        earned: totalEarned >= 500,
        current: Math.min(Math.round(totalEarned), 500),
        target: 500,
        unit: "৳",
      },
      {
        key: "top_earner",
        labelBn: "টপ আর্নার",
        labelEn: "Top Earner",
        icon: "Trophy",
        earned: totalEarned >= 1000,
        current: Math.min(Math.round(totalEarned), 1000),
        target: 1000,
        unit: "৳",
      },
      {
        key: "veteran",
        labelBn: "অভিজ্ঞ",
        labelEn: "Veteran",
        icon: "Award",
        earned: approvedCount >= 20,
        current: Math.min(approvedCount, 20),
        target: 20,
        unit: "কাজ",
      },
    ];

    // Find next unearned badge
    const nextBadge = badges.find((b) => !b.earned);
    const earnedCount = badges.filter((b) => b.earned).length;

    return NextResponse.json({
      badges,
      earnedCount,
      totalBadges: badges.length,
      nextBadge,
    });
  } catch (e) {
    console.error("Achievements progress error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
