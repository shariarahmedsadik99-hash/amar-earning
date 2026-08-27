import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - earnings data for the last N days (for dashboard chart)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get earnings transactions (JOB_EARN) for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        type: "JOB_EARN",
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by day
    const days: { date: string; label: string; amount: number; count: number }[] = [];
    const dayNamesBn = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
    const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const dayTx = transactions.filter((t) => {
        const td = new Date(t.createdAt);
        return td >= d && td < next;
      });

      const amount = dayTx.reduce((s, t) => s + t.amount, 0);
      const lang = (typeof window !== "undefined" && localStorage.getItem("ae_lang")) || "bn";
      const dayName = lang === "en" ? dayNamesEn[d.getDay()] : dayNamesBn[d.getDay()];

      days.push({
        date: d.toISOString(),
        label: dayName,
        amount,
        count: dayTx.length,
      });
    }

    const totalThisWeek = days.reduce((s, d) => s + d.amount, 0);

    return NextResponse.json({ days, totalThisWeek });
  } catch (e) {
    console.error("Earnings error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
