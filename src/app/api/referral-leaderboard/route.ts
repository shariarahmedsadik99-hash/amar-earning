import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - top referrers leaderboard (top 20 by referral bonus earned)
export async function GET() {
  try {
    // Get users who earned referral bonuses, ranked by total bonus
    const referralTransactions = await db.transaction.findMany({
      where: { type: "REFERRAL_BONUS" },
      select: {
        userId: true,
        amount: true,
      },
    });

    // Aggregate by user
    const userBonusMap: Record<string, number> = {};
    for (const tx of referralTransactions) {
      userBonusMap[tx.userId] = (userBonusMap[tx.userId] || 0) + tx.amount;
    }

    // Get user details for top referrers
    const topUserIds = Object.entries(userBonusMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    const userIds = topUserIds.map(([id]) => id);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
        _count: { select: { referrals: true } },
      },
    });

    const userMap: Record<string, typeof users[number]> = {};
    for (const u of users) userMap[u.id] = u;

    const leaderboard = topUserIds.map(([userId, bonus], i) => {
      const u = userMap[userId];
      if (!u) return null;
      return {
        rank: i + 1,
        name: u.name,
        username: u.username,
        totalBonus: bonus,
        referralsCount: u._count.referrals,
        joinedAt: u.createdAt,
      };
    }).filter(Boolean);

    return NextResponse.json({ leaderboard });
  } catch (e) {
    console.error("Referral leaderboard error:", e);
    return NextResponse.json({ leaderboard: [] }, { status: 200 });
  }
}
