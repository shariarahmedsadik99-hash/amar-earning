import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - list current user's bookmarks
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await db.bookmark.findMany({
      where: { userId: user.id },
      include: {
        job: {
          include: {
            category: true,
            owner: { select: { name: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookmarks });
  } catch (e) {
    console.error("Bookmarks list error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - toggle bookmark (add if not exists, remove if exists)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }

    const job = await db.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Cannot bookmark own job
    if (job.ownerId === user.id) {
      return NextResponse.json({ error: "Cannot bookmark own job" }, { status: 400 });
    }

    const existing = await db.bookmark.findUnique({
      where: { userId_jobId: { userId: user.id, jobId } },
    });

    if (existing) {
      await db.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, bookmarked: false });
    } else {
      await db.bookmark.create({ data: { userId: user.id, jobId } });
      return NextResponse.json({ ok: true, bookmarked: true });
    }
  } catch (e) {
    console.error("Bookmark toggle error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET bookmark status for a specific job
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ bookmarked: false });
    }
    const { jobId } = await req.json();
    const existing = await db.bookmark.findUnique({
      where: { userId_jobId: { userId: user.id, jobId } },
    });
    return NextResponse.json({ bookmarked: !!existing });
  } catch {
    return NextResponse.json({ bookmarked: false });
  }
}
