import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { creditWallet, debitWallet } from "@/lib/wallet";

// GET - all user dispute reports (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const reason = searchParams.get("reason");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;

    const reports = await db.userReport.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, username: true, email: true } },
        reported: { select: { id: true, name: true, username: true, email: true, status: true } },
        job: { select: { id: true, title: true, reward: true, ownerId: true } },
        resolver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("Admin user-reports list error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH - resolve / dismiss a dispute (admin only)
// action: resolve | dismiss
// resolution: REFUND_WORKER | WARN_REPORTED | SUSPEND_REPORTED | NO_ACTION | OTHER
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { reportId, action, resolution, adminNote } = body;

    if (!reportId || !action) {
      return NextResponse.json({ error: "reportId and action required" }, { status: 400 });
    }
    if (!["resolve", "dismiss"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const report = await db.userReport.findUnique({
      where: { id: reportId },
      include: {
        job: { select: { id: true, title: true, reward: true, ownerId: true } },
      },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status === "RESOLVED" || report.status === "DISMISSED") {
      return NextResponse.json({ error: "Report already closed" }, { status: 400 });
    }

    const newStatus = action === "dismiss" ? "DISMISSED" : "RESOLVED";
    const finalResolution = action === "dismiss" ? "NO_ACTION" : (resolution || "OTHER");

    await db.userReport.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        resolution: finalResolution,
        adminNote: adminNote?.trim() || null,
        resolvedById: user.id,
        resolvedAt: new Date(),
      },
    });

    // If admin chose REFUND_WORKER, credit the worker (reporter) the job reward
    // and debit the employer (the reported user) — only meaningful when the report
    // came from the worker against the job's owner.
    if (finalResolution === "REFUND_WORKER" && report.job) {
      const reward = report.job.reward;
      // The reporter is the worker; the reported is the employer (job owner)
      if (report.job.ownerId === report.reportedId) {
        try {
          await creditWallet(
            report.reporterId,
            reward,
            "REFUND",
            `বিরোধ সমাধান: ${report.job.title} (রিপোর্ট #${report.id.slice(-6)})`
          );
          await debitWallet(
            report.reportedId,
            reward,
            "JOB_SPEND",
            `বিরোধ সমাধান: ${report.job.title} কাজের পেমেন্ট`
          );
        } catch (e) {
          console.error("Refund worker error:", e);
        }
      }
    }

    // If admin chose SUSPEND_REPORTED, suspend the reported user
    if (finalResolution === "SUSPEND_REPORTED") {
      await db.user.update({
        where: { id: report.reportedId },
        data: { status: "SUSPENDED" },
      });
    }

    // Admin log
    await db.adminLog.create({
      data: {
        adminId: user.id,
        action: `USER_REPORT_${action.toUpperCase()}`,
        target: reportId,
        detail: `Report ${reportId} ${action}ed. Resolution: ${finalResolution}`,
      },
    });

    // Notify both parties
    const reasonLabels: Record<string, string> = {
      NON_PAYMENT: "টাকা পরিশোধ করেনি",
      FAKE_ISSUE: "ভুয়া সমস্যা",
      WRONG_SUBMISSION: "ভুল কাজ",
      ABUSE: "হয়রানি",
      SPAM: "স্প্যাম",
      OTHER: "অন্যান্য",
    };
    const resolutionLabels: Record<string, string> = {
      REFUND_WORKER: "কর্মীকে টাকা ফেরত দেওয়া হয়েছে",
      WARN_REPORTED: "রিপোর্টকৃত ইউজারকে সতর্ক করা হয়েছে",
      SUSPEND_REPORTED: "রিপোর্টকৃত ইউজারকে স্থগিত করা হয়েছে",
      NO_ACTION: "কোনো ব্যবস্থা নেওয়া হয়নি",
      OTHER: "অন্যান্য",
    };
    const verdict = resolutionLabels[finalResolution] || finalResolution;

    await db.notification.create({
      data: {
        userId: report.reporterId,
        title: "আপনার রিপোর্ট সমাধান হয়েছে",
        message: `${reasonLabels[report.reason] || report.reason} রিপোর্টটি পর্যালোচনা করা হয়েছে। সিদ্ধান্ত: ${verdict}`,
        type: "ANNOUNCEMENT",
      },
    });
    await db.notification.create({
      data: {
        userId: report.reportedId,
        title: "আপনার বিরুদ্ধে একটি রিপোর্ট পর্যালোচনা সম্পন্ন হয়েছে",
        message: `${reasonLabels[report.reason] || report.reason} সম্পর্কিত রিপোর্টটি পর্যালোচনা করা হয়েছে। সিদ্ধান্ত: ${verdict}`,
        type: "ANNOUNCEMENT",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin user-report patch error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
