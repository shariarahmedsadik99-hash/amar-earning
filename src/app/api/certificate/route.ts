import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - certificate data for an approved submission
export async function GET(req: NextRequest) {
  try {
    const submissionId = new URL(req.url).searchParams.get("submissionId");
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submission = await db.jobSubmission.findUnique({
      where: { id: submissionId },
      include: {
        job: {
          include: {
            category: true,
            owner: { select: { name: true, username: true } },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Only the submission owner can download their certificate
    if (submission.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only approved submissions get a certificate
    if (submission.status !== "APPROVED") {
      return NextResponse.json({ error: "Submission not approved" }, { status: 400 });
    }

    const certificate = {
      certificateId: `AE-CERT-${submission.id.slice(-8).toUpperCase()}`,
      recipientName: user.name,
      recipientUsername: user.username,
      jobTitle: submission.job.title,
      categoryName: submission.job.category.name,
      reward: submission.job.reward,
      ownerName: submission.job.owner.name,
      completedAt: submission.reviewedAt || submission.createdAt,
      issuedAt: new Date().toISOString(),
    };

    return NextResponse.json({ certificate });
  } catch (e) {
    console.error("Certificate error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
