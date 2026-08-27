import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - admin dashboard charts data (last 30 days)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [submissions, transactions, newUsers, withdrawals] = await Promise.all([
      // Submissions per day
      db.jobSubmission.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
      // Transactions per day
      db.transaction.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, amount: true, type: true },
        orderBy: { createdAt: "asc" },
      }),
      // New users per day
      db.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Withdrawals per day
      db.withdrawal.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, amount: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Build day buckets for 30 days
    const days: Array<{
      date: string;
      label: string;
      submissions: number;
      earnings: number;
      spending: number;
      newUsers: number;
      withdrawals: number;
    }> = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const daySubs = submissions.filter((s) => {
        const td = new Date(s.createdAt);
        return td >= d && td < next;
      });
      const dayTx = transactions.filter((t) => {
        const td = new Date(t.createdAt);
        return td >= d && td < next;
      });
      const dayUsers = newUsers.filter((u) => {
        const td = new Date(u.createdAt);
        return td >= d && td < next;
      });
      const dayWd = withdrawals.filter((w) => {
        const td = new Date(w.createdAt);
        return td >= d && td < next;
      });

      days.push({
        date: d.toISOString(),
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        submissions: daySubs.length,
        earnings: dayTx.filter((t) => t.type === "JOB_EARN").reduce((s, t) => s + t.amount, 0),
        spending: dayTx.filter((t) => t.type === "JOB_SPEND").reduce((s, t) => s + Math.abs(t.amount), 0),
        newUsers: dayUsers.length,
        withdrawals: dayWd.length,
      });
    }

    // Status breakdown for submissions
    const statusBreakdown = {
      pending: submissions.filter((s) => s.status === "PENDING").length,
      approved: submissions.filter((s) => s.status === "APPROVED").length,
      rejected: submissions.filter((s) => s.status === "REJECTED").length,
    };

    return NextResponse.json({ days, statusBreakdown });
  } catch (e) {
    console.error("Admin charts error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
