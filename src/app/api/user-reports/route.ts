import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const VALID_REASONS = [
  "NON_PAYMENT",     // Worker: employer didn't pay after work was done
  "FAKE_ISSUE",      // Worker: employer invented fake issue to avoid payment
  "WRONG_SUBMISSION",// Employer: worker submitted wrong/incomplete work
  "ABUSE",           // Abusive / harassing behavior
  "SPAM",            // Spam / scam
  "OTHER",           // Other
];

// POST - create a dispute report against another user
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reportedId, jobId, submissionId, reason, detail } = body;

    if (!reportedId) {
      return NextResponse.json({ error: "reportedId required" }, { status: 400 });
    }
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
    }
    if (reportedId === user.id) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    // Validate reported user exists
    const reported = await db.user.findUnique({ where: { id: reportedId } });
    if (!reported) {
      return NextResponse.json({ error: "Reported user not found" }, { status: 404 });
    }

    // If jobId provided, validate it exists and one of the parties owns it
    if (jobId) {
      const job = await db.job.findUnique({ where: { id: jobId } });
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      if (job.ownerId !== user.id && job.ownerId !== reportedId) {
        return NextResponse.json(
          { error: "Reported user is not related to this job" },
          { status: 400 }
        );
      }
    }

    // If submissionId provided, validate it exists and links reporter + reported
    if (submissionId) {
      const sub = await db.jobSubmission.findUnique({ where: { id: submissionId } });
      if (!sub) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }
      if (sub.userId !== user.id && sub.userId !== reportedId) {
        return NextResponse.json(
          { error: "Submission does not involve the reported user" },
          { status: 400 }
        );
      }
    }

    // Prevent duplicate active report (same reporter + reported + same submission)
    if (submissionId) {
      const existing = await db.userReport.findFirst({
        where: {
          reporterId: user.id,
          reportedId,
          submissionId,
          status: { in: ["PENDING", "REVIEWING"] },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "আপনি ইতিমধ্যে এই সাবমিশন সম্পর্কে রিপোর্ট করেছেন" },
          { status: 400 }
        );
      }
    }

    const report = await db.userReport.create({
      data: {
        reporterId: user.id,
        reportedId,
        jobId: jobId || null,
        submissionId: submissionId || null,
        reason,
        detail: detail?.trim() || null,
        status: "PENDING",
      },
      include: {
        reported: { select: { id: true, name: true, username: true } },
      },
    });

    // Notify all admins
    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    const reasonLabels: Record<string, string> = {
      NON_PAYMENT: "টাকা পরিশোধ করেনি",
      FAKE_ISSUE: "ভুয়া সমস্যা",
      WRONG_SUBMISSION: "ভুল কাজ",
      ABUSE: "হয়রানি",
      SPAM: "স্প্যাম",
      OTHER: "অন্যান্য",
    };
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "নতুন বিরোধ রিপোর্ট",
          message: `${user.name} → ${reported.name} (${reasonLabels[reason] || reason})`,
          type: "ANNOUNCEMENT",
        },
      });
    }

    return NextResponse.json({ ok: true, report });
  } catch (e) {
    console.error("UserReport create error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}

// GET - list reports filed by or against the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const direction = searchParams.get("direction") || "all"; // filed | against | all

    const where: Record<string, unknown> = {};
    if (direction === "filed") where.reporterId = user.id;
    else if (direction === "against") where.reportedId = user.id;
    else {
      where.OR = [{ reporterId: user.id }, { reportedId: user.id }];
    }

    const reports = await db.userReport.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, username: true } },
        reported: { select: { id: true, name: true, username: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("UserReport list error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
