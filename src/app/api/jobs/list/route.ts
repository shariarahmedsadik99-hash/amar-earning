import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

export async function GET(req: NextRequest) {
  try {
    await seedDatabase();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const ownerId = searchParams.get("ownerId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (category && category !== "all") where.categoryId = category;
    if (ownerId) where.ownerId = ownerId;
    if (status) where.status = status;
    else where.status = "ACTIVE";
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const jobs = await db.job.findMany({
      where,
      include: {
        category: true,
        owner: { select: { name: true, username: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await db.job.count({ where });

    return NextResponse.json({ jobs, total });
  } catch (e) {
    console.error("Jobs list error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
