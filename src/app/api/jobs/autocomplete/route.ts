import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - job title autocomplete suggestions
export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q") || "";
    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const jobs = await db.job.findMany({
      where: {
        status: "ACTIVE",
        title: { contains: q },
      },
      select: {
        id: true,
        title: true,
        reward: true,
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    // Also get unique titles for broader suggestions
    const suggestions = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      reward: j.reward,
      categoryName: j.category.name,
    }));

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("Autocomplete error:", e);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
