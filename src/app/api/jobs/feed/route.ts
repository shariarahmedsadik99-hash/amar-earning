import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - public jobs feed (JSON format for external integration)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (category) where.category = { slug: category };

    const jobs = await db.job.findMany({
      where,
      include: {
        category: true,
        owner: { select: { name: true, username: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const feed = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      reward: job.reward,
      currency: "BDT",
      workerLimit: job.workerLimit,
      completedCount: job.completedCount,
      slotsRemaining: job.workerLimit - job.completedCount,
      category: job.category.name,
      categorySlug: job.category.slug,
      owner: job.owner.name,
      ownerUsername: job.owner.username,
      deadline: job.deadline,
      createdAt: job.createdAt,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/#/jobs/${job.id}`,
    }));

    return NextResponse.json({
      platform: "Amar Earning",
      tagline: "কাজ করুন, আয় করুন।",
      totalJobs: feed.length,
      generatedAt: new Date().toISOString(),
      jobs: feed,
    });
  } catch (e) {
    console.error("Jobs feed error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
