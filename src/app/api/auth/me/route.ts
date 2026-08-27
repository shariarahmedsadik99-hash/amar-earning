import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const wallet = await db.wallet.findUnique({ where: { userId: user.id } });
  const unreadCount = await db.notification.count({
    where: { userId: user.id, read: false },
  });

  return NextResponse.json({
    user,
    wallet: wallet ? { balance: wallet.balance, totalEarned: wallet.totalEarned, totalSpent: wallet.totalSpent, pendingBalance: wallet.pendingBalance } : null,
    unreadNotifications: unreadCount,
  });
}
