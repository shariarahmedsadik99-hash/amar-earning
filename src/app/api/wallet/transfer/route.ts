import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/wallet";

// Transfer fee percentage (applied on both directions)
const TRANSFER_FEE_PERCENT = 15;

// POST /api/wallet/transfer — transfer money between freelancer and client balances.
// Body: { amount: number, direction: "freelancer-to-client" | "client-to-freelancer" }
// A 15% fee is deducted from the transfer and recorded as a FEE transaction.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const amountNum = parseFloat(body.amount);
    const direction: string = body.direction || "freelancer-to-client";

    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "পরিমাণ সঠিক নয়" }, { status: 400 });
    }
    if (direction !== "freelancer-to-client" && direction !== "client-to-freelancer") {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }

    const wallet = await db.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      return NextResponse.json({ error: "ওয়ালেট পাওয়া যায়নি" }, { status: 404 });
    }

    // Calculate fee: 15% of the transfer amount
    const fee = +(amountNum * (TRANSFER_FEE_PERCENT / 100)).toFixed(2);
    const receivedAmount = +(amountNum - fee).toFixed(2);

    if (direction === "freelancer-to-client") {
      // Debit from freelancer balance
      if (wallet.balance < amountNum) {
        return NextResponse.json(
          { error: `অপর্যাপ্ত ফ্রিল্যান্সার ব্যালেন্স (আপনার ব্যালেন্স: ৳${wallet.balance})` },
          { status: 400 }
        );
      }
      const newFreelancerBalance = +(wallet.balance - amountNum).toFixed(2);
      const newClientBalance = +(wallet.clientBalance + receivedAmount).toFixed(2);

      await db.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId: user.id },
          data: {
            balance: newFreelancerBalance,
            clientBalance: newClientBalance,
          },
        });

        // Debit transaction (freelancer → out)
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "TRANSFER_OUT",
            amount: -amountNum,
            description: `ফ্রিল্যান্সার → ক্লায়েন্ট ব্যালেন্সে ট্রান্সফার (৳${amountNum})`,
            balanceAfter: newFreelancerBalance,
          },
        });

        // Fee transaction
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "TRANSFER_FEE",
            amount: -fee,
            description: `ট্রান্সফার ফি (${TRANSFER_FEE_PERCENT}%)`,
            balanceAfter: newFreelancerBalance,
          },
        });

        // Credit transaction (client ← in, after fee)
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "TRANSFER_IN",
            amount: receivedAmount,
            description: `ফ্রিল্যান্সার থেকে ক্লায়েন্ট ব্যালেন্সে ট্রান্সফার প্রাপ্ত (ফি কাটা পরে ৳${receivedAmount})`,
            balanceAfter: newClientBalance,
          },
        });
      });

      await notify(
        user.id,
        "ব্যালেন্স ট্রান্সফার সফল",
        `৳${amountNum} ফ্রিল্যান্সার থেকে ক্লায়েন্ট ব্যালেন্সে ট্রান্সফার হয়েছে। ${TRANSFER_FEE_PERCENT}% ফি (৳${fee}) কাটা হয়েছে। ক্লায়েন্ট ব্যালেন্সে ৳${receivedAmount} যোগ হয়েছে।`,
        "ANNOUNCEMENT"
      );

      return NextResponse.json({
        ok: true,
        balance: newFreelancerBalance,
        clientBalance: newClientBalance,
        fee,
        receivedAmount,
      });
    } else {
      // direction === "client-to-freelancer"
      if (wallet.clientBalance < amountNum) {
        return NextResponse.json(
          { error: `অপর্যাপ্ত ক্লায়েন্ট ব্যালেন্স (আপনার ব্যালেন্স: ৳${wallet.clientBalance})` },
          { status: 400 }
        );
      }
      const newClientBalance = +(wallet.clientBalance - amountNum).toFixed(2);
      const newFreelancerBalance = +(wallet.balance + receivedAmount).toFixed(2);

      await db.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId: user.id },
          data: {
            clientBalance: newClientBalance,
            balance: newFreelancerBalance,
            totalEarned: { increment: receivedAmount },
          },
        });

        // Debit transaction (client → out)
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "TRANSFER_OUT",
            amount: -amountNum,
            description: `ক্লায়েন্ট → ফ্রিল্যান্সার ব্যালেন্সে ট্রান্সফার (৳${amountNum})`,
            balanceAfter: newClientBalance,
          },
        });

        // Fee transaction
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "TRANSFER_FEE",
            amount: -fee,
            description: `ট্রান্সফার ফি (${TRANSFER_FEE_PERCENT}%)`,
            balanceAfter: newClientBalance,
          },
        });

        // Credit transaction (freelancer ← in, after fee)
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: "TRANSFER_IN",
            amount: receivedAmount,
            description: `ক্লায়েন্ট থেকে ফ্রিল্যান্সার ব্যালেন্সে ট্রান্সফার প্রাপ্ত (ফি কাটা পরে ৳${receivedAmount})`,
            balanceAfter: newFreelancerBalance,
          },
        });
      });

      await notify(
        user.id,
        "ব্যালেন্স ট্রান্সফার সফল",
        `৳${amountNum} ক্লায়েন্ট থেকে ফ্রিল্যান্সার ব্যালেন্সে ট্রান্সফার হয়েছে। ${TRANSFER_FEE_PERCENT}% ফি (৳${fee}) কাটা হয়েছে। ফ্রিল্যান্সার ব্যালেন্সে ৳${receivedAmount} যোগ হয়েছে।`,
        "ANNOUNCEMENT"
      );

      return NextResponse.json({
        ok: true,
        balance: newFreelancerBalance,
        clientBalance: newClientBalance,
        fee,
        receivedAmount,
      });
    }
  } catch (e) {
    console.error("Transfer error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
