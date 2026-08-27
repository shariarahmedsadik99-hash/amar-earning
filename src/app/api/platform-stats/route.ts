import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - public platform statistics (no auth required)
export async function GET() {
  try {
    const [
      totalUsers,
      totalJobs,
      activeJobs,
      totalSubmissions,
      approvedSubmissions,
      totalTransactions,
      earningsTx,
      withdrawals,
      categories,
    ] = await Promise.all([
      db.user.count(),
      db.job.count(),
      db.job.count({ where: { status: "ACTIVE" } }),
      db.jobSubmission.count(),
      db.jobSubmission.count({ where: { status: "APPROVED" } }),
      db.transaction.count(),
      db.transaction.findMany({ where: { type: "JOB_EARN" }, select: { amount: true } }),
      db.withdrawal.count({ where: { status: { in: ["APPROVED", "PAID"] } } }),
      db.category.findMany({
        include: {
          _count: { select: { jobs: { where: { status: "ACTIVE" } } } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const totalPaidOut = earningsTx.reduce((s, t) => s + t.amount, 0);

    // Top categories by job count
    const topCategories = categories
      .map((c) => ({
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        jobCount: c._count.jobs,
      }))
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 6);

    // Recent growth (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [newUsersThisWeek, newUsersLastWeek, jobsThisWeek, jobsLastWeek] = await Promise.all([
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.user.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
      db.job.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.job.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    ]);

    return NextResponse.json({
      totals: {
        users: totalUsers,
        jobs: totalJobs,
        activeJobs,
        submissions: totalSubmissions,
        approvedSubmissions,
        transactions: totalTransactions,
        paidOut: totalPaidOut,
        withdrawals,
      },
      topCategories,
      growth: {
        newUsersThisWeek,
        newUsersLastWeek,
        jobsThisWeek,
        jobsLastWeek,
        userGrowthRate:
          newUsersLastWeek > 0
            ? Math.round(((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100)
            : newUsersThisWeek > 0
            ? 100
            : 0,
        jobGrowthRate:
          jobsLastWeek > 0
            ? Math.round(((jobsThisWeek - jobsLastWeek) / jobsLastWeek) * 100)
            : jobsThisWeek > 0
            ? 100
            : 0,
      },
    });
  } catch (e) {
    console.error("Platform stats error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
