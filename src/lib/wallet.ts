import { db } from "./db";

export async function creditWallet(
  userId: string,
  amount: number,
  type: string,
  description: string
) {
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("WALLET_NOT_FOUND");

  const newBalance = wallet.balance + amount;
  await db.wallet.update({
    where: { userId },
    data: {
      balance: newBalance,
      totalEarned: type === "JOB_EARN" || type === "REFERRAL_BONUS" || type === "REFUND" || type === "DEPOSIT"
        ? { increment: amount }
        : undefined,
      pendingBalance: type === "REFUND" ? { decrement: amount } : undefined,
    },
  });

  await db.transaction.create({
    data: {
      userId,
      type,
      amount,
      description,
      balanceAfter: newBalance,
    },
  });

  return newBalance;
}

export async function debitWallet(
  userId: string,
  amount: number,
  type: string,
  description: string
) {
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("WALLET_NOT_FOUND");
  if (wallet.balance < amount) throw new Error("INSUFFICIENT_BALANCE");

  const newBalance = wallet.balance - amount;
  await db.wallet.update({
    where: { userId },
    data: {
      balance: newBalance,
      totalSpent: { increment: amount },
    },
  });

  await db.transaction.create({
    data: {
      userId,
      type,
      amount: -amount,
      description,
      balanceAfter: newBalance,
    },
  });

  return newBalance;
}

export async function holdAmount(
  userId: string,
  amount: number,
  type: string,
  description: string
) {
  // Move from balance to pendingBalance (for withdrawals)
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("WALLET_NOT_FOUND");
  if (wallet.balance < amount) throw new Error("INSUFFICIENT_BALANCE");

  const newBalance = wallet.balance - amount;
  const newPending = wallet.pendingBalance + amount;
  await db.wallet.update({
    where: { userId },
    data: {
      balance: newBalance,
      pendingBalance: newPending,
    },
  });

  await db.transaction.create({
    data: {
      userId,
      type,
      amount: -amount,
      description,
      balanceAfter: newBalance,
    },
  });

  return newBalance;
}

export async function refundHeldAmount(
  userId: string,
  amount: number,
  description: string
) {
  // Refund held/pending amount back to balance (for rejected withdrawals)
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("WALLET_NOT_FOUND");

  const newBalance = wallet.balance + amount;
  const newPending = Math.max(0, wallet.pendingBalance - amount);
  await db.wallet.update({
    where: { userId },
    data: {
      balance: newBalance,
      pendingBalance: newPending,
    },
  });

  await db.transaction.create({
    data: {
      userId,
      type: "REFUND",
      amount,
      description,
      balanceAfter: newBalance,
    },
  });

  return newBalance;
}

export async function notify(
  userId: string,
  title: string,
  message: string,
  type: string
) {
  await db.notification.create({
    data: { userId, title, message, type },
  });
}
