import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { creditWallet, notify, isNotificationEnabled } from "@/lib/wallet";

// GET - list submissions (filtered by user, or by job owner)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "mine"; // mine | job
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (scope === "mine") {
      where.userId = user.id;
    } else if (scope === "job" && jobId) {
      // Verify ownership
      const job = await db.job.findUnique({ where: { id: jobId } });
      if (!job || job.ownerId !== user.id) {
        return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
      }
      where.jobId = jobId;
    } else if (scope === "admin") {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
      }
    } else {
      where.userId = user.id;
    }

    if (status) where.status = status;

    const submissions = await db.jobSubmission.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            reward: true,
            categoryId: true,
            ownerId: true,
            category: true,
          },
        },
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ submissions });
  } catch (e) {
    console.error("Submissions list error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - submit proof
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, textProof, imageProof, urlProof } = body;

    if (!jobId) {
      return NextResponse.json({ error: "কাজ আইডি প্রয়োজন" }, { status: 400 });
    }

    const job = await db.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "কাজ পাওয়া যায়নি" }, { status: 404 });
    }

    if (job.status !== "ACTIVE") {
      return NextResponse.json({ error: "এই কাজটি এখন গ্রহণযোগ্য নয়" }, { status: 400 });
    }

    // Rule 1: cannot complete own job
    if (job.ownerId === user.id) {
      return NextResponse.json({ error: "আপনি নিজের কাজ সম্পন্ন করতে পারবেন না" }, { status: 400 });
    }

    // Rule 2: cannot submit same job twice
    const existing = await db.jobSubmission.findUnique({
      where: { jobId_userId: { jobId, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "আপনি এই কাজে ইতিমধ্যে আবেদন করেছেন" }, { status: 400 });
    }

    // Rule 3: worker limit
    if (job.completedCount >= job.workerLimit) {
      return NextResponse.json({ error: "এই কাজের স্লট পূর্ণ" }, { status: 400 });
    }

    // Deadline check
    if (new Date(job.deadline) < new Date()) {
      return NextResponse.json({ error: "এই কাজের সময় শেষ" }, { status: 400 });
    }

    if (!textProof && !imageProof && !urlProof) {
      return NextResponse.json({ error: "অন্তত একটি প্রমাণ দিন" }, { status: 400 });
    }

    const submission = await db.jobSubmission.create({
      data: {
        jobId,
        userId: user.id,
        textProof: textProof || null,
        imageProof: imageProof || null,
        urlProof: urlProof || null,
        status: "PENDING",
      },
    });

    // Increment completed count (slots filled)
    await db.job.update({
      where: { id: jobId },
      data: { completedCount: { increment: 1 } },
    });

    // Notify job owner
    await db.notification.create({
      data: {
        userId: job.ownerId,
        title: "নতুন সাবমিশন",
        message: `"${job.title}" কাজে নতুন সাবমিশন এসেছে। রিভিউ করুন।`,
        type: "ANNOUNCEMENT",
      },
    });

    return NextResponse.json({ ok: true, submission });
  } catch (e) {
    console.error("Submit error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}

// PATCH - approve/reject submission
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { submissionId, action, rejectReason } = body; // action: approve | reject

    if (!submissionId || !action) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }

    const submission = await db.jobSubmission.findUnique({
      where: { id: submissionId },
      include: { job: true },
    });
    if (!submission) {
      return NextResponse.json({ error: "সাবমিশন পাওয়া যায়নি" }, { status: 404 });
    }

    // Only job owner or admin can review
    const isOwner = submission.job.ownerId === user.id;
    const isAdmin = user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
    }

    if (submission.status !== "PENDING") {
      return NextResponse.json({ error: "এই সাবমিশন ইতিমধ্যে রিভিউ করা হয়েছে" }, { status: 400 });
    }

    if (action === "approve") {
      // Check if worker has this notification type enabled
      const shouldNotify = await isNotificationEnabled(submission.userId, "SUBMISSION_APPROVED");
      await db.$transaction(async (tx) => {
        await tx.jobSubmission.update({
          where: { id: submissionId },
          data: { status: "APPROVED", reviewedAt: new Date() },
        });
        // Credit reward to worker
        const wallet = await tx.wallet.findUnique({ where: { userId: submission.userId } });
        const newBalance = (wallet?.balance ?? 0) + submission.job.reward;
        await tx.wallet.update({
          where: { userId: submission.userId },
          data: {
            balance: newBalance,
            totalEarned: { increment: submission.job.reward },
          },
        });
        await tx.transaction.create({
          data: {
            userId: submission.userId,
            type: "JOB_EARN",
            amount: submission.job.reward,
            description: `কাজ সম্পন্ন: ${submission.job.title}`,
            balanceAfter: newBalance,
          },
        });
        if (shouldNotify) {
          await tx.notification.create({
            data: {
              userId: submission.userId,
              title: "সাবমিশন অনুমোদিত!",
              message: `আপনার "${submission.job.title}" কাজের সাবমিশন অনুমোদিত হয়েছে। ৳${submission.job.reward} যোগ হয়েছে।`,
              type: "SUBMISSION_APPROVED",
            },
          });
        }
      });
    } else if (action === "reject") {
      // Check if worker has this notification type enabled
      const shouldNotify = await isNotificationEnabled(submission.userId, "SUBMISSION_REJECTED");
      await db.$transaction(async (tx) => {
        await tx.jobSubmission.update({
          where: { id: submissionId },
          data: {
            status: "REJECTED",
            reviewedAt: new Date(),
            rejectReason: rejectReason || null,
          },
        });
        // Decrement completed count to free the slot
        await tx.job.update({
          where: { id: submission.jobId },
          data: { completedCount: { decrement: 1 } },
        });
        if (shouldNotify) {
          await tx.notification.create({
            data: {
              userId: submission.userId,
              title: "সাবমিশন প্রত্যাখ্যাত",
              message: `আপনার "${submission.job.title}" কাজের সাবমিশন প্রত্যাখ্যাত হয়েছে।${rejectReason ? ` কারণ: ${rejectReason}` : ""}`,
              type: "SUBMISSION_REJECTED",
            },
          });
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Review error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
