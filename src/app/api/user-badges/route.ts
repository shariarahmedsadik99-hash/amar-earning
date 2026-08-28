import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - compute badges for current user based on activity
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

    type Badge = {
      key: string;
      labelBn: string;
      labelEn: string;
      icon: string;
      color: string;
      earned: boolean;
      descriptionBn: string;
      descriptionEn: string;
    };

    const badges: Badge[] = [
      {
        key: "newbie",
        labelBn: "নবাগত",
        labelEn: "Newbie",
        icon: "Sparkles",
        color: "blue",
        earned: true,
        descriptionBn: "অ্যাকাউন্ট তৈরি করেছেন",
        descriptionEn: "Created an account",
      },
      {
        key: "first_job",
        labelBn: "প্রথম কাজ",
        labelEn: "First Job",
        icon: "CheckCircle2",
        color: "green",
        earned: approvedCount >= 1,
        descriptionBn: "প্রথম কাজ সম্পন্ন করেছেন",
        descriptionEn: "Completed first job",
      },
      {
        key: "active_worker",
        labelBn: "সক্রিয় কর্মী",
        labelEn: "Active Worker",
        icon: "Zap",
        color: "yellow",
        earned: approvedCount >= 5,
        descriptionBn: "৫টি কাজ সম্পন্ন করেছেন",
        descriptionEn: "Completed 5 jobs",
      },
      {
        key: "pro_earner",
        labelBn: "প্রো আর্নার",
        labelEn: "Pro Earner",
        icon: "Crown",
        color: "amber",
        earned: totalEarned >= 500,
        descriptionBn: "৫০০৳ বা তার বেশি আয় করেছেন",
        descriptionEn: "Earned ৳500 or more",
      },
      {
        key: "top_earner",
        labelBn: "টপ আর্নার",
        labelEn: "Top Earner",
        icon: "Trophy",
        color: "purple",
        earned: totalEarned >= 1000,
        descriptionBn: "১০০০৳ বা তার বেশি আয় করেছেন",
        descriptionEn: "Earned ৳1000 or more",
      },
      {
        key: "job_creator",
        labelBn: "কাজ প্রদানকারী",
        labelEn: "Job Creator",
        icon: "Briefcase",
        color: "indigo",
        earned: jobsPosted >= 1,
        descriptionBn: "প্রথম কাজ পোস্ট করেছেন",
        descriptionEn: "Posted first job",
      },
      {
        key: "employer",
        labelBn: "নিয়োগকর্তা",
        labelEn: "Employer",
        icon: "Building2",
        color: "cyan",
        earned: jobsPosted >= 5,
        descriptionBn: "৫টি কাজ পোস্ট করেছেন",
        descriptionEn: "Posted 5 jobs",
      },
      {
        key: "veteran",
        labelBn: "অভিজ্ঞ",
        labelEn: "Veteran",
        icon: "Award",
        color: "rose",
        earned: approvedCount >= 20,
        descriptionBn: "২০টি কাজ সম্পন্ন করেছেন",
        descriptionEn: "Completed 20 jobs",
      },
    ];

    const earnedCount = badges.filter((b) => b.earned).length;

    return NextResponse.json({ badges, earnedCount, totalBadges: badges.length });
  } catch (e) {
    console.error("User badges error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
