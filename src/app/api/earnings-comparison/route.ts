import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - week-over-week earnings comparison
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    // This week: last 7 days
    const thisWeekStart = new Date();
    thisWeekStart.setDate(now.getDate() - 6);
    thisWeekStart.setHours(0, 0, 0, 0);

    // Last week: 7-14 days ago
    const lastWeekStart = new Date();
    lastWeekStart.setDate(now.getDate() - 13);
    lastWeekStart.setHours(0, 0, 0, 0);
    const lastWeekEnd = new Date(thisWeekStart);

    const [thisWeekTx, lastWeekTx, thisWeekSubs, lastWeekSubs] = await Promise.all([
      // Earnings this week
      db.transaction.findMany({
        where: {
          userId: user.id,
          type: "JOB_EARN",
          createdAt: { gte: thisWeekStart },
        },
        select: { amount: true },
      }),
      // Earnings last week
      db.transaction.findMany({
        where: {
          userId: user.id,
          type: "JOB_EARN",
          createdAt: { gte: lastWeekStart, lt: lastWeekEnd },
        },
        select: { amount: true },
      }),
      // Submissions this week
      db.jobSubmission.count({
        where: {
          userId: user.id,
          createdAt: { gte: thisWeekStart },
        },
      }),
      // Submissions last week
      db.jobSubmission.count({
        where: {
          userId: user.id,
          createdAt: { gte: lastWeekStart, lt: lastWeekEnd },
        },
      }),
    ]);

    const thisWeekEarned = thisWeekTx.reduce((s, t) => s + t.amount, 0);
    const lastWeekEarned = lastWeekTx.reduce((s, t) => s + t.amount, 0);

    // Calculate percentage change
    const earningsChange =
      lastWeekEarned > 0
        ? Math.round(((thisWeekEarned - lastWeekEarned) / lastWeekEarned) * 100)
        : thisWeekEarned > 0
        ? 100
        : 0;

    const submissionsChange =
      lastWeekSubs > 0
        ? Math.round(((thisWeekSubs - lastWeekSubs) / lastWeekSubs) * 100)
        : thisWeekSubs > 0
        ? 100
        : 0;

    return NextResponse.json({
      thisWeek: {
        earned: thisWeekEarned,
        submissions: thisWeekSubs,
      },
      lastWeek: {
        earned: lastWeekEarned,
        submissions: lastWeekSubs,
      },
      earningsChange,
      submissionsChange,
    });
  } catch (e) {
    console.error("Earnings comparison error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
