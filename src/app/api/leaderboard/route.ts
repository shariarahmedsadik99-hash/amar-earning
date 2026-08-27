import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - public top earners leaderboard (top 20 by totalEarned)
export async function GET() {
  try {
    const wallets = await db.wallet.findMany({
      where: { totalEarned: { gt: 0 } },
      orderBy: { totalEarned: "desc" },
      take: 20,
      select: {
        totalEarned: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            createdAt: true,
            _count: { select: { submissions: true } },
          },
        },
      },
    });

    const leaderboard = wallets.map((w, i) => ({
      rank: i + 1,
      name: w.user.name,
      username: w.user.username,
      totalEarned: w.totalEarned,
      jobsCompleted: w.user._count.submissions,
      joinedAt: w.user.createdAt,
    }));

    return NextResponse.json({ leaderboard });
  } catch (e) {
    console.error("Leaderboard error:", e);
    return NextResponse.json({ leaderboard: [] }, { status: 200 });
  }
}
