import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { creditWallet, isNotificationEnabled } from "@/lib/wallet";

// GET - user's deposit history (or admin sees all)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");

    let where: Record<string, unknown> = { userId: user.id };
    if (scope === "admin") {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      where = {};
    }

    const deposits = await db.deposit.findMany({
      where,
      include: {
        user: { select: { name: true, username: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ deposits });
  } catch (e) {
    console.error("Deposits list error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - submit a deposit request
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, method, senderNumber, transactionId } = await req.json();

    // Validation
    if (!amount || !method || !senderNumber || !transactionId) {
      return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 10) {
      return NextResponse.json({ error: "সর্বনিম্ন ডিপোজিট ৳10" }, { status: 400 });
    }

    if (senderNumber.length < 10) {
      return NextResponse.json({ error: "সঠিক ফোন নম্বর দিন" }, { status: 400 });
    }

    if (transactionId.length < 6) {
      return NextResponse.json({ error: "সঠিক ট্রানজেকশন আইডি দিন" }, { status: 400 });
    }

    const deposit = await db.deposit.create({
      data: {
        userId: user.id,
        amount: amountNum,
        method,
        senderNumber,
        transactionId,
        status: "PENDING",
      },
    });

    // Notify admins
    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "নতুন ডিপোজিট রিকোয়েস্ট",
          message: `${user.name} ৳${amountNum} ডিপোজিট করেছেন (${method})। ট্রানজেকশন: ${transactionId}`,
          type: "ANNOUNCEMENT",
        },
      });
    }

    return NextResponse.json({ ok: true, deposit });
  } catch (e) {
    console.error("Deposit submit error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
