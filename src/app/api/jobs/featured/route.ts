import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - featured jobs: admin-flagged featured jobs first, then highest reward as fallback
export async function GET() {
  try {
    // Get admin-flagged featured jobs
    const featuredJobs = await db.job.findMany({
      where: {
        status: "ACTIVE",
        featured: true,
      },
      include: {
        category: true,
        owner: { select: { name: true, username: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: [{ reward: "desc" }, { createdAt: "desc" }],
      take: 4,
    });

    // If fewer than 4 featured jobs, fill with highest-reward jobs
    if (featuredJobs.length < 4) {
      const featuredIds = featuredJobs.map((j) => j.id);
      const fallback = await db.job.findMany({
        where: {
          status: "ACTIVE",
          id: { notIn: featuredIds },
        },
        include: {
          category: true,
          owner: { select: { name: true, username: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: [{ reward: "desc" }, { createdAt: "desc" }],
        take: 4 - featuredJobs.length,
      });
      return NextResponse.json({ jobs: [...featuredJobs, ...fallback] });
    }

    return NextResponse.json({ jobs: featuredJobs });
  } catch (e) {
    console.error("Featured jobs error:", e);
    return NextResponse.json({ jobs: [] }, { status: 200 });
  }
}

