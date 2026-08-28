import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { jobs: true } } },
    });
    return NextResponse.json({ categories });
  } catch (e) {
    console.error("Admin categories error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { name, icon } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const category = await db.category.create({
      data: { name, slug, icon: icon || "Briefcase" },
    });
    return NextResponse.json({ ok: true, category });
  } catch (e) {
    console.error("Admin category create error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { categoryId, action, name, icon } = await req.json();

    if (action === "delete") {
      const jobsCount = await db.job.count({ where: { categoryId } });
      if (jobsCount > 0) {
        return NextResponse.json(
          { error: "Cannot delete category with jobs. Move jobs first." },
          { status: 400 }
        );
      }
      await db.category.delete({ where: { id: categoryId } });
    } else {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      await db.category.update({
        where: { id: categoryId },
        data: { name, slug, icon: icon || "Briefcase" },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin category patch error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
