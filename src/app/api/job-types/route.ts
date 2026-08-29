import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - fetch job types by category
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId required" }, { status: 400 });
    }

    const jobTypes = await db.jobType.findMany({
      where: { categoryId },
      orderBy: { reward: "asc" },
    });

    return NextResponse.json({ jobTypes });
  } catch (e) {
    console.error("Job types error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
