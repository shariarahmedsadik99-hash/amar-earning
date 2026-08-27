import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - category stats: job counts per category
export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { jobs: { where: { status: "ACTIVE" } } },
        },
        jobs: {
          where: { status: "ACTIVE" },
          select: { reward: true },
          take: 100,
        },
      },
      orderBy: { name: "asc" },
    });

    const stats = categories.map((c) => {
      const rewards = c.jobs.map((j) => j.reward);
      const avgReward = rewards.length > 0 ? rewards.reduce((a, b) => a + b, 0) / rewards.length : 0;
      const maxReward = rewards.length > 0 ? Math.max(...rewards) : 0;
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        jobCount: c._count.jobs,
        avgReward: Math.round(avgReward * 100) / 100,
        maxReward,
      };
    });

    return NextResponse.json({ categories: stats });
  } catch (e) {
    console.error("Categories stats error:", e);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}
