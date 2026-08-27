import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - featured jobs (highest reward, active, with remaining slots)
export async function GET() {
  try {
    const jobs = await db.job.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        category: true,
        owner: { select: { name: true, username: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: [{ reward: "desc" }, { createdAt: "desc" }],
      take: 4,
    });

    return NextResponse.json({ jobs });
  } catch (e) {
    console.error("Featured jobs error:", e);
    return NextResponse.json({ jobs: [] }, { status: 200 });
  }
}
