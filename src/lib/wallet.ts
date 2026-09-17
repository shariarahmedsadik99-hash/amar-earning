import { db } from "./db";

/**
 * Referral bonus configuration.
 *
 * Bonus is NOT awarded at registration time. Instead it's awarded when the
 * referred user hits a ৳1000 milestone:
 *   - Worker: when totalEarned reaches ৳1000 (checked after each submission approval)
 *   - Employer: when they post a job with total budget (reward × workers) ≥ ৳1000
 */
export const REFERRAL_BONUS_AMOUNT = 20;
export const REFERRAL_MILESTONE = 1000; // ৳1000

/**
 * Check if a referred user has hit the referral milestone, and if so,
 * award the referrer the bonus. Safe to call multiple times — it checks
 * for an existing REFERRAL_BONUS transaction with the referred user's id
 * in the description to avoid double-awarding.
 *
 * @param referredUserId  The user who was referred (whose activity triggered the check)
 * @param trigger         "EARN" (worker earned) | "JOB_POST" (employer posted a job)
 * @returns true if the bonus was awarded (or already had been), false if not applicable
 */
export async function checkAndAwardReferralBonus(
  referredUserId: string,
  trigger: "EARN" | "JOB_POST"
): Promise<boolean> {
  const referred = await db.user.findUnique({
    where: { id: referredUserId },
    select: { id: true, name: true, username: true, referredById: true },
  });
  if (!referred || !referred.referredById) return false;

  // Avoid double-awarding: check if we already gave a REFERRAL_BONUS for this user.
  // We store the referred user's id in the description for dedup.
  const dedupTag = `ref:${referred.id}`;
  const existing = await db.transaction.findFirst({
    where: {
      userId: referred.referredById,
      type: "REFERRAL_BONUS",
      description: { contains: dedupTag },
    },
  });
  if (existing) return true; // already awarded

  // Determine if the milestone is met
  let milestoneMet = false;
  let milestoneReason = "";

  if (trigger === "EARN") {
    // Worker earnings milestone
    const wallet = await db.wallet.findUnique({ where: { userId: referred.id } });
    const totalEarned = wallet?.totalEarned ?? 0;
    if (totalEarned >= REFERRAL_MILESTONE) {
      milestoneMet = true;
      milestoneReason = `৳${REFERRAL_MILESTONE} আয়`;
    }
  } else if (trigger === "JOB_POST") {
    // Employer job-post milestone — checked by caller (job post route)
    // The caller should only invoke this when total job budget >= 1000,
    // so we trust the trigger here.
    const wallet = await db.wallet.findUnique({ where: { userId: referred.id } });
    const totalSpent = wallet?.totalSpent ?? 0;
    if (totalSpent >= REFERRAL_MILESTONE) {
      milestoneMet = true;
      milestoneReason = `৳${REFERRAL_MILESTONE} কাজ পোস্ট`;
    }
  }

  if (!milestoneMet) return false;

  // Award the bonus to the referrer
  const description = `রেফারেল বোনাস: ${referred.name} (@${referred.username}) — ${milestoneReason} [${dedupTag}]`;
  await creditWallet(
    referred.referredById,
    REFERRAL_BONUS_AMOUNT,
    "REFERRAL_BONUS",
    description
  );

  // Notify the referrer
  await db.notification.create({
    data: {
      userId: referred.referredById,
      title: "রেফারেল বোনাস! 🎉",
      message: `${referred.name} (@${referred.username}) ${milestoneReason} করেছেন। আপনি ৳${REFERRAL_BONUS_AMOUNT} রেফারেল বোনাস পেয়েছেন।`,
      type: "ANNOUNCEMENT",
    },
  });

  // Notify the referred user that their referrer was rewarded
  await db.notification.create({
    data: {
      userId: referred.id,
      title: "মাইলস্টোন অর্জন! 🎉",
      message: `আপনি ${milestoneReason} মাইলস্টোন অর্জন করেছেন। আপনার রেফারার বোনাস পেয়েছেন। কাজ চালিয়ে যান!`,
      type: "ANNOUNCEMENT",
    },
  });

  return true;
}

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

/**
 * Credit the CLIENT balance (used when money is deposited/transferred for job posting).
 * Does NOT touch the freelancer `balance`.
 */
export async function creditClientBalance(
  userId: string,
  amount: number,
  type: string,
  description: string
) {
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("WALLET_NOT_FOUND");

  const newClientBalance = wallet.clientBalance + amount;
  await db.wallet.update({
    where: { userId },
    data: {
      clientBalance: newClientBalance,
    },
  });

  await db.transaction.create({
    data: {
      userId,
      type,
      amount,
      description,
      balanceAfter: newClientBalance,
    },
  });

  return newClientBalance;
}

/**
 * Debit from the CLIENT balance (used when posting a job).
 * Does NOT touch the freelancer `balance`.
 */
export async function debitClientBalance(
  userId: string,
  amount: number,
  type: string,
  description: string
) {
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("WALLET_NOT_FOUND");
  if (wallet.clientBalance < amount) throw new Error("INSUFFICIENT_CLIENT_BALANCE");

  const newClientBalance = wallet.clientBalance - amount;
  await db.wallet.update({
    where: { userId },
    data: {
      clientBalance: newClientBalance,
      totalSpent: { increment: amount },
    },
  });

  await db.transaction.create({
    data: {
      userId,
      type,
      amount: -amount,
      description,
      balanceAfter: newClientBalance,
    },
  });

  return newClientBalance;
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

// Map notification types to settings keys
const NOTIFY_TYPE_TO_SETTING: Record<string, string> = {
  SUBMISSION_APPROVED: "submissionApproved",
  SUBMISSION_REJECTED: "submissionRejected",
  WITHDRAWAL_APPROVED: "withdrawalApproved",
  WITHDRAWAL_REJECTED: "withdrawalRejected",
  JOB_COMPLETED: "jobCompleted",
  ANNOUNCEMENT: "announcement",
};

// Check if a user has enabled a specific notification type
export async function isNotificationEnabled(userId: string, type: string): Promise<boolean> {
  const settingKey = NOTIFY_TYPE_TO_SETTING[type];
  if (!settingKey) return true; // unmapped types always allowed
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { notifySettings: true },
  });
  if (!user?.notifySettings) return true; // default: enabled
  try {
    const settings = JSON.parse(user.notifySettings);
    return settings[settingKey] !== false;
  } catch {
    return true;
  }
}

export async function notify(
  userId: string,
  title: string,
  message: string,
  type: string
) {
  // Check user's notification settings; skip if disabled
  const settingKey = NOTIFY_TYPE_TO_SETTING[type];
  if (settingKey) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { notifySettings: true },
    });
    if (user?.notifySettings) {
      try {
        const settings = JSON.parse(user.notifySettings);
        if (settings[settingKey] === false) {
          return; // User opted out of this notification type
        }
      } catch {}
    }
  }
  await db.notification.create({
    data: { userId, title, message, type },
  });
}


