import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/role/switch — switch activeRole between FREELANCER and CLIENT
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { role } = body; // "FREELANCER" | "CLIENT"

    if (role !== "FREELANCER" && role !== "CLIENT") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Admins can't switch role (they're admins)
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Admins cannot switch role" }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { activeRole: role },
    });

    return NextResponse.json({
      ok: true,
      activeRole: role,
      message: role === "FREELANCER"
        ? "ফ্রিল্যান্সার মোডে স্যুইচ হয়েছে"
        : "ক্লায়েন্ট মোডে স্যুইচ হয়েছে",
    });
  } catch (e) {
    console.error("Role switch error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
