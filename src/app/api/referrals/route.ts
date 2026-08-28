import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get users referred by current user
    const referrals = await db.user.findMany({
      where: { referredById: user.id },
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
        wallet: { select: { totalEarned: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Total referral bonus earned
    const referralBonuses = await db.transaction.findMany({
      where: { userId: user.id, type: "REFERRAL_BONUS" },
    });
    const totalBonus = referralBonuses.reduce((s, t) => s + t.amount, 0);

    return NextResponse.json({
      referrals,
      totalReferrals: referrals.length,
      totalBonus,
      referralCode: user.referralCode,
    });
  } catch (e) {
    console.error("Referrals error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
