import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        referralCode: true,
        createdAt: true,
        wallet: { select: { balance: true, totalEarned: true, totalSpent: true } },
        _count: { select: { jobs: true, submissions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (e) {
    console.error("Admin users error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, action } = await req.json(); // action: suspend | activate

    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot modify admin" }, { status: 400 });
    }

    const newStatus = action === "suspend" ? "SUSPENDED" : "ACTIVE";
    await db.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    await db.adminLog.create({
      data: {
        adminId: user.id,
        action: action.toUpperCase(),
        target: userId,
        detail: `User ${target.username} ${action}ed`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin user patch error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
