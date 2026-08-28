import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - get rating stats for a job + current user's rating
export async function GET(req: NextRequest) {
  try {
    const jobId = new URL(req.url).searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }

    const ratings = await db.jobRating.findMany({
      where: { jobId },
      select: { difficulty: true, userId: true },
    });

    const user = await getCurrentUser();
    const myRating = user
      ? ratings.find((r) => r.userId === user.id)?.difficulty || null
      : null;

    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r.difficulty, 0) / ratings.length) * 10) / 10
        : 0;

    return NextResponse.json({
      avgRating,
      totalRatings: ratings.length,
      myRating,
      distribution: {
        1: ratings.filter((r) => r.difficulty === 1).length,
        2: ratings.filter((r) => r.difficulty === 2).length,
        3: ratings.filter((r) => r.difficulty === 3).length,
        4: ratings.filter((r) => r.difficulty === 4).length,
        5: ratings.filter((r) => r.difficulty === 5).length,
      },
    });
  } catch (e) {
    console.error("Job ratings GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - rate a job difficulty (only after approved submission)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, difficulty } = await req.json();
    if (!jobId || !difficulty) {
      return NextResponse.json({ error: "jobId and difficulty required" }, { status: 400 });
    }

    const diff = parseInt(difficulty);
    if (isNaN(diff) || diff < 1 || diff > 5) {
      return NextResponse.json({ error: "Difficulty must be 1-5" }, { status: 400 });
    }

    // Must have an approved submission for this job
    const submission = await db.jobSubmission.findUnique({
      where: { jobId_userId: { jobId, userId: user.id } },
    });
    if (!submission || submission.status !== "APPROVED") {
      return NextResponse.json(
        { error: "You can only rate jobs you've completed and got approved" },
        { status: 400 }
      );
    }

    // Check if already rated
    const existing = await db.jobRating.findUnique({
      where: { jobId_userId: { jobId, userId: user.id } },
    });
    if (existing) {
      // Update existing rating
      await db.jobRating.update({
        where: { id: existing.id },
        data: { difficulty: diff },
      });
      return NextResponse.json({ ok: true, updated: true });
    }

    await db.jobRating.create({
      data: { jobId, userId: user.id, difficulty: diff },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Job rating POST error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
