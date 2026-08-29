import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { creditWallet } from "@/lib/wallet";

// PATCH - admin approves or rejects a deposit
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { depositId, action, rejectReason } = await req.json();

    if (!depositId || !action) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }

    const deposit = await db.deposit.findUnique({ where: { id: depositId } });
    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    if (deposit.status !== "PENDING") {
      return NextResponse.json({ error: "ইতিমধ্যে প্রসেস করা হয়েছে" }, { status: 400 });
    }

    if (action === "approve") {
      // Credit the user's wallet
      await db.$transaction(async (tx) => {
        await tx.deposit.update({
          where: { id: depositId },
          data: { status: "APPROVED", processedAt: new Date() },
        });

        const wallet = await tx.wallet.findUnique({ where: { userId: deposit.userId } });
        const newBalance = (wallet?.balance ?? 0) + deposit.amount;
        await tx.wallet.update({
          where: { userId: deposit.userId },
          data: {
            balance: newBalance,
            totalEarned: { increment: deposit.amount },
          },
        });

        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: "DEPOSIT",
            amount: deposit.amount,
            description: `ডিপোজিট: ${deposit.method} (TXID: ${deposit.transactionId})`,
            balanceAfter: newBalance,
          },
        });

        await tx.notification.create({
          data: {
            userId: deposit.userId,
            title: "ডিপোজিট অনুমোদিত!",
            message: `আপনার ৳${deposit.amount} ডিপোজিট অনুমোদিত হয়েছে এবং ব্যালেন্সে যোগ হয়েছে।`,
            type: "ANNOUNCEMENT",
          },
        });
      });

      await db.adminLog.create({
        data: {
          adminId: user.id,
          action: "DEPOSIT_APPROVE",
          target: depositId,
          detail: `Deposit ৳${deposit.amount} approved for ${deposit.userId}`,
        },
      });
    } else if (action === "reject") {
      await db.deposit.update({
        where: { id: depositId },
        data: {
          status: "REJECTED",
          rejectReason: rejectReason || null,
          processedAt: new Date(),
        },
      });

      await db.notification.create({
        data: {
          userId: deposit.userId,
          title: "ডিপোজিট প্রত্যাখ্যাত",
          message: `আপনার ৳${deposit.amount} ডিপোজিট প্রত্যাখ্যাত হয়েছে।${rejectReason ? ` কারণ: ${rejectReason}` : ""}`,
          type: "ANNOUNCEMENT",
        },
      });

      await db.adminLog.create({
        data: {
          adminId: user.id,
          action: "DEPOSIT_REJECT",
          target: depositId,
          detail: `Deposit ৳${deposit.amount} rejected for ${deposit.userId}`,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Deposit review error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
