import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const ownerId = searchParams.get("ownerId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const minReward = searchParams.get("minReward");
    const maxReward = searchParams.get("maxReward");
    const sortBy = searchParams.get("sortBy") || "newest";
    const deadlineFilter = searchParams.get("deadline");

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

    // Reward range filter
    const rewardFilter: Record<string, unknown> = {};
    if (minReward) rewardFilter.gte = parseFloat(minReward);
    if (maxReward) rewardFilter.lte = parseFloat(maxReward);
    if (Object.keys(rewardFilter).length > 0) where.reward = rewardFilter;

    // Deadline filter
    if (deadlineFilter && deadlineFilter !== "any") {
      const now = new Date();
      if (deadlineFilter === "7days") {
        const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        where.deadline = { gte: now, lte: sevenDays };
      } else if (deadlineFilter === "3days") {
        const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        where.deadline = { gte: now, lte: threeDays };
      } else if (deadlineFilter === "expired") {
        where.deadline = { lt: now };
      }
    }

    // Sort
    let orderBy: Record<string, string> = { createdAt: "desc" };
    switch (sortBy) {
      case "rewardHigh":
        orderBy = { reward: "desc" };
        break;
      case "rewardLow":
        orderBy = { reward: "asc" };
        break;
      case "deadline":
        orderBy = { deadline: "asc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const jobs = await db.job.findMany({
      where,
      include: {
        category: true,
        owner: { select: { name: true, username: true } },
        _count: { select: { submissions: true } },
      },
      orderBy,
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
