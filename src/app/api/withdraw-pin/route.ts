import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Hash a 4-digit PIN using bcrypt
async function hashPin(pin: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(pin, 10);
}

// Verify a PIN against the stored hash
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compare(pin, hash);
  } catch {
    return false;
  }
}

// GET - check if user has a withdraw PIN set
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { withdrawPin: true },
    });

    return NextResponse.json({ hasPin: !!fullUser?.withdrawPin });
  } catch (e) {
    console.error("Check PIN error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - set or update the withdraw PIN
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pin, currentPin } = await req.json();

    // Validate PIN is exactly 4 digits
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN অবশ্যই ৪ ডিজিটের হতে হবে" }, { status: 400 });
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { withdrawPin: true },
    });

    // If user already has a PIN, verify the current PIN before allowing change
    if (fullUser?.withdrawPin) {
      if (!currentPin) {
        return NextResponse.json({ error: "বর্তমান PIN দিন" }, { status: 400 });
      }
      const valid = await verifyPin(currentPin, fullUser.withdrawPin);
      if (!valid) {
        return NextResponse.json({ error: "বর্তমান PIN ভুল" }, { status: 400 });
      }
    }

    const hashedPin = await hashPin(pin);
    await db.user.update({
      where: { id: user.id },
      data: { withdrawPin: hashedPin },
    });

    return NextResponse.json({ ok: true, message: "PIN সফলভাবে সেট করা হয়েছে" });
  } catch (e) {
    console.error("Set PIN error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}

// PUT - verify PIN (used by withdrawal flow)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pin } = await req.json();

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { withdrawPin: true },
    });

    if (!fullUser?.withdrawPin) {
      return NextResponse.json({ valid: false, noPin: true });
    }

    const valid = await verifyPin(pin, fullUser.withdrawPin);
    return NextResponse.json({ valid });
  } catch (e) {
    console.error("Verify PIN error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
