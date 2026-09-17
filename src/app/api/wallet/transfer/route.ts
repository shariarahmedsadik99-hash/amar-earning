import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/wallet";

// POST /api/wallet/transfer — transfer money from freelancer balance to client balance
// Body: { amount: number }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const amountNum = parseFloat(body.amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "পরিমাণ সঠিক নয়" }, { status: 400 });
    }

    const wallet = await db.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      return NextResponse.json({ error: "ওয়ালেট পাওয়া যায়নি" }, { status: 404 });
    }

    if (wallet.balance < amountNum) {
      return NextResponse.json(
        { error: `অপর্যাপ্ত ফ্রিল্যান্সার ব্যালেন্স (আপনার ব্যালেন্স: ৳${wallet.balance})` },
        { status: 400 }
      );
    }

    // Transfer: debit freelancer balance + credit client balance atomically
    const newFreelancerBalance = wallet.balance - amountNum;
    const newClientBalance = wallet.clientBalance + amountNum;

    await db.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: newFreelancerBalance,
          clientBalance: newClientBalance,
        },
      });

      // Debit transaction (freelancer → transfer)
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "TRANSFER_OUT",
          amount: -amountNum,
          description: `ফ্রিল্যান্সার → ক্লায়েন্ট ব্যালেন্সে ট্রান্সফার`,
          balanceAfter: newFreelancerBalance,
        },
      });

      // Credit transaction (client ← transfer)
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "TRANSFER_IN",
          amount: amountNum,
          description: `ফ্রিল্যান্সার থেকে ক্লায়েন্ট ব্যালেন্সে ট্রান্সফার প্রাপ্ত`,
          balanceAfter: newClientBalance,
        },
      });
    });

    // Notify the user
    await notify(
      user.id,
      "ব্যালেন্স ট্রান্সফার সফল",
      `৳${amountNum} ফ্রিল্যান্সার ব্যালেন্স থেকে ক্লায়েন্ট ব্যালেন্সে ট্রান্সফার হয়েছে। এখন আপনি কাজ পোস্ট করতে পারবেন।`,
      "ANNOUNCEMENT"
    );

    return NextResponse.json({
      ok: true,
      balance: newFreelancerBalance,
      clientBalance: newClientBalance,
    });
  } catch (e) {
    console.error("Transfer error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
