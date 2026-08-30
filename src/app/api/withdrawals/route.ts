import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { holdAmount, refundHeldAmount, creditWallet, notify, isNotificationEnabled } from "@/lib/wallet";
import { getSettings } from "@/lib/settings";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");

    let where: Record<string, unknown> = { userId: user.id };
    if (scope === "admin") {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
      }
      where = {};
    }

    const withdrawals = await db.withdrawal.findMany({
      where,
      include: { user: { select: { name: true, username: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ withdrawals });
  } catch (e) {
    console.error("Withdrawals list error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { method, accountNumber, amount } = body;

    if (!method || !accountNumber || !amount) {
      return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
    }

    const validMethods = ["BKASH", "NAGAD", "ROCKET"];
    if (!validMethods.includes(method)) {
      return NextResponse.json({ error: "অবৈধ পেমেন্ট মেথড" }, { status: 400 });
    }

    if (accountNumber.length < 10) {
      return NextResponse.json({ error: "সঠিক অ্যাকাউন্ট নম্বর দিন" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "পরিমাণ সঠিক নয়" }, { status: 400 });
    }

    const settings = await getSettings();
    const fee = settings.withdrawalFee;
    const userReceives = amountNum - fee;

    if (amountNum < settings.minWithdrawal) {
      return NextResponse.json(
        { error: `সর্বনিম্ন উইথড্র ${settings.minWithdrawal}৳` },
        { status: 400 }
      );
    }

    if (userReceives <= 0) {
      return NextResponse.json(
        { error: `উইথড্র পরিমাণ ৳${fee} ফি এর চেয়ে বেশি হতে হবে` },
        { status: 400 }
      );
    }

    const wallet = await db.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || wallet.balance < amountNum) {
      return NextResponse.json({ error: "পর্যাপ্ত ব্যালেন্স নেই" }, { status: 400 });
    }

    // Hold the amount (full amount including fee)
    await holdAmount(user.id, amountNum, "WITHDRAWAL", `উইথড্র রিকোয়েস্ট: ${method} ${accountNumber} (ফি ৳${fee}, ইউজার পাবে ৳${userReceives})`);

    const withdrawal = await db.withdrawal.create({
      data: {
        userId: user.id,
        amount: amountNum,
        method,
        accountNumber,
        status: "PENDING",
      },
    });

    // Notify admins
    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "নতুন উইথড্র রিকোয়েস্ট",
          message: `${user.name} ৳${amountNum} উইথড্র করতে চান (${method})। ফি ৳${fee}, ইউজার পাবে ৳${userReceives}।`,
          type: "ANNOUNCEMENT",
        },
      });
    }

    // Notify user
    await db.notification.create({
      data: {
        userId: user.id,
        title: "উইথড্র রিকোয়েস্ট গৃহীত",
        message: `আপনার ৳${amountNum} উইথড্র রিকোয়েস্ট গৃহীত হয়েছে। ফি ৳${fee}, আপনি পাবেন ৳${userReceives}। অ্যাডমিন অনুমোদনের পর টাকা পাঠানো হবে।`,
        type: "ANNOUNCEMENT",
      },
    });

    return NextResponse.json({ ok: true, withdrawal, fee, userReceives });
  } catch (e) {
    console.error("Withdraw error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}

// PATCH - approve/reject withdrawal (admin)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
    }

    const body = await req.json();
    const { withdrawalId, action, rejectReason } = body;

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }

    const withdrawal = await db.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal) {
      return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
    }

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json({ error: "ইতিমধ্যে প্রসেস করা হয়েছে" }, { status: 400 });
    }

    if (action === "approve" || action === "paid") {
      // Check if user has this notification type enabled
      const shouldNotify = await isNotificationEnabled(withdrawal.userId, "WITHDRAWAL_APPROVED");
      // Mark as paid - money was already held, now finalize (deduct from pending)
      await db.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: action === "paid" ? "PAID" : "APPROVED", processedAt: new Date() },
        });
        // Reduce pendingBalance (money already removed from balance at request time)
        await tx.wallet.update({
          where: { userId: withdrawal.userId },
          data: { pendingBalance: { decrement: withdrawal.amount } },
        });
        if (shouldNotify) {
          await tx.notification.create({
            data: {
              userId: withdrawal.userId,
              title: "উইথড্র অনুমোদিত",
              message: `আপনার ${withdrawal.amount}৳ উইথড্র রিকোয়েস্ট অনুমোদিত হয়েছে এবং পাঠানো হয়েছে।`,
              type: "WITHDRAWAL_APPROVED",
            },
          });
        }
      });
    } else if (action === "reject") {
      // Refund the held amount
      await refundHeldAmount(
        withdrawal.userId,
        withdrawal.amount,
        `উইথড্র বাতিল: ${withdrawal.method}`
      );
      await db.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: "REJECTED", rejectReason: rejectReason || null, processedAt: new Date() },
      });
      // Check if user has this notification type enabled
      const shouldNotifyReject = await isNotificationEnabled(withdrawal.userId, "WITHDRAWAL_REJECTED");
      if (shouldNotifyReject) {
        await db.notification.create({
          data: {
            userId: withdrawal.userId,
            title: "উইথড্র প্রত্যাখ্যাত",
            message: `আপনার ${withdrawal.amount}৳ উইথড্র রিকোয়েস্ট প্রত্যাখ্যাত হয়েছে।${rejectReason ? ` কারণ: ${rejectReason}` : ""} টাকা ফেরত দেওয়া হয়েছে।`,
            type: "WITHDRAWAL_REJECTED",
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Withdrawal review error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
