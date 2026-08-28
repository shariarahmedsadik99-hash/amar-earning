import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
    }

    // Find by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ইউজার পাওয়া যায়নি" }, { status: 400 });
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে" }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "ভুল পাসওয়ার্ড" }, { status: 400 });
    }

    await createSession(user.id);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
