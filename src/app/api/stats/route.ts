import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [totalUsers, totalJobs, activeJobs, transactions] = await Promise.all([
      db.user.count(),
      db.job.count(),
      db.job.count({ where: { status: "ACTIVE" } }),
      db.transaction.findMany({ where: { type: "JOB_EARN" } }),
    ]);

    const totalPaid = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    return NextResponse.json({
      totalUsers,
      totalJobs,
      activeJobs,
      totalPaid,
    });
  } catch (e) {
    console.error("Stats error:", e);
    return NextResponse.json({ totalUsers: 0, totalJobs: 0, totalPaid: 0 }, { status: 200 });
  }
}
