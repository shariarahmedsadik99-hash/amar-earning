import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - recommended jobs for the current user based on their category history
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's submission history to find their preferred categories
    const submissions = await db.jobSubmission.findMany({
      where: { userId: user.id },
      include: { job: { select: { id: true, categoryId: true } } },
    });

    // Count category preferences
    const categoryCount: Record<string, number> = {};
    for (const s of submissions) {
      const catId = s.job.categoryId;
      categoryCount[catId] = (categoryCount[catId] || 0) + 1;
    }

    // Get jobs the user has already submitted to (to exclude)
    const excludeJobIds = submissions.map((s) => s.job.id);

    // Sort categories by preference
    const preferredCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .map(([catId]) => catId);

    let recommendedJobs = [];

    if (preferredCategories.length > 0) {
      // Recommend jobs from preferred categories first
      const topCategory = preferredCategories[0];
      recommendedJobs = await db.job.findMany({
        where: {
          status: "ACTIVE",
          categoryId: topCategory,
          id: { notIn: excludeJobIds },
          ownerId: { not: user.id },
        },
        include: {
          category: true,
          owner: { select: { name: true, username: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: [{ reward: "desc" }, { createdAt: "desc" }],
        take: 4,
      });
    }

    // If not enough recommendations from preferred categories, fill with general top jobs
    if (recommendedJobs.length < 4) {
      const existingIds = recommendedJobs.map((j) => j.id);
      const fallback = await db.job.findMany({
        where: {
          status: "ACTIVE",
          id: { notIn: [...excludeJobIds, ...existingIds] },
          ownerId: { not: user.id },
        },
        include: {
          category: true,
          owner: { select: { name: true, username: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: [{ reward: "desc" }, { createdAt: "desc" }],
        take: 4 - recommendedJobs.length,
      });
      recommendedJobs = [...recommendedJobs, ...fallback];
    }

    return NextResponse.json({
      jobs: recommendedJobs,
      reason: preferredCategories.length > 0 ? "based_on_history" : "top_jobs",
    });
  } catch (e) {
    console.error("Recommendations error:", e);
    return NextResponse.json({ jobs: [], reason: "top_jobs" }, { status: 200 });
  }
}
