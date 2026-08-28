import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - dashboard activity feed: recent submissions, approvals, withdrawals, transactions
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch recent activity items from multiple sources
    const [submissions, transactions, withdrawals] = await Promise.all([
      // Recent submissions (as worker)
      db.jobSubmission.findMany({
        where: { userId: user.id },
        include: { job: { select: { title: true, reward: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Recent transactions
      db.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Recent withdrawals
      db.withdrawal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    // Also fetch submissions on user's jobs (as employer)
    const ownedJobs = await db.job.findMany({
      where: { ownerId: user.id },
      select: { id: true, title: true },
      take: 50,
    });
    const jobIds = ownedJobs.map((j) => j.id);
    const jobMap: Record<string, string> = {};
    ownedJobs.forEach((j) => (jobMap[j.id] = j.title));

    const incomingSubmissions = await db.jobSubmission.findMany({
      where: { jobId: { in: jobIds }, status: "PENDING" },
      include: { user: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    type Activity = {
      id: string;
      type: string; // submission_pending | submission_approved | submission_rejected | withdrawal_pending | withdrawal_approved | withdrawal_rejected | transaction
      title: string;
      description: string;
      amount?: number;
      timestamp: string;
      icon: string;
    };

    const activities: Activity[] = [];

    // Worker submissions
    submissions.forEach((s) => {
      if (s.status === "PENDING") {
        activities.push({
          id: s.id,
          type: "submission_pending",
          title: s.job.title,
          description: `সাবমিশন জমা দেওয়া হয়েছে`,
          amount: s.job.reward,
          timestamp: s.createdAt,
          icon: "Clock",
        });
      } else if (s.status === "APPROVED") {
        activities.push({
          id: s.id,
          type: "submission_approved",
          title: s.job.title,
          description: `সাবমিশন অনুমোদিত হয়েছে`,
          amount: s.job.reward,
          timestamp: s.reviewedAt || s.createdAt,
          icon: "CheckCircle2",
        });
      } else if (s.status === "REJECTED") {
        activities.push({
          id: s.id,
          type: "submission_rejected",
          title: s.job.title,
          description: `সাবমিশন প্রত্যাখ্যাত হয়েছে`,
          amount: s.job.reward,
          timestamp: s.reviewedAt || s.createdAt,
          icon: "XCircle",
        });
      }
    });

    // Withdrawals
    withdrawals.forEach((w) => {
      activities.push({
        id: w.id,
        type: `withdrawal_${w.status.toLowerCase()}`,
        title: `উইথড্র ${w.method}`,
        description:
          w.status === "PENDING"
            ? `উইথড্র রিকোয়েস্ট অপেক্ষমাণ`
            : w.status === "APPROVED" || w.status === "PAID"
            ? `উইথড্র অনুমোদিত`
            : `উইথড্র প্রত্যাখ্যাত`,
        amount: w.amount,
        timestamp: w.createdAt,
        icon: "Banknote",
      });
    });

    // Transactions (only earnings/spends, skip withdrawal-related since covered above)
    transactions.forEach((tx) => {
      if (tx.type === "WITHDRAWAL") return; // covered by withdrawals
      activities.push({
        id: tx.id,
        type: "transaction",
        title: tx.description,
        description: tx.type === "JOB_EARN" ? "কাজ থেকে আয়" : tx.type === "JOB_SPEND" ? "কাজ পোস্ট খরচ" : tx.type,
        amount: tx.amount,
        timestamp: tx.createdAt,
        icon: tx.amount > 0 ? "TrendingUp" : "TrendingDown",
      });
    });

    // Incoming submissions (as employer)
    incomingSubmissions.forEach((s) => {
      const jobTitle = jobMap[s.jobId] || "কাজ";
      activities.push({
        id: `incoming-${s.id}`,
        type: "incoming_submission",
        title: jobTitle,
        description: `${s.user.name} নতুন সাবমিশন করেছেন`,
        timestamp: s.createdAt,
        icon: "Inbox",
      });
    });

    // Sort all by timestamp desc and take 15
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ activities: activities.slice(0, 15) });
  } catch (e) {
    console.error("Activity feed error:", e);
    return NextResponse.json({ activities: [] }, { status: 200 });
  }
}
