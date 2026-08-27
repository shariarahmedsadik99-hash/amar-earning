import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalUsers,
      activeJobs,
      pendingSubmissions,
      pendingWithdrawals,
      totalTransactions,
      totalJobs,
      suspendedUsers,
      totalWithdrawn,
    ] = await Promise.all([
      db.user.count(),
      db.job.count({ where: { status: "ACTIVE" } }),
      db.jobSubmission.count({ where: { status: "PENDING" } }),
      db.withdrawal.count({ where: { status: "PENDING" } }),
      db.transaction.count(),
      db.job.count(),
      db.user.count({ where: { status: "SUSPENDED" } }),
      db.withdrawal.findMany({ where: { status: { in: ["APPROVED", "PAID"] } } }),
    ]);

    const withdrawnAmount = totalWithdrawn.reduce((s, w) => s + w.amount, 0);

    return NextResponse.json({
      totalUsers,
      activeJobs,
      pendingSubmissions,
      pendingWithdrawals,
      totalTransactions,
      totalJobs,
      suspendedUsers,
      withdrawnAmount,
    });
  } catch (e) {
    console.error("Admin stats error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
