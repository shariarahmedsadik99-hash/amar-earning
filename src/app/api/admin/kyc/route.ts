import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - list all KYC submissions (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // PENDING | VERIFIED | REJECTED

    const where: Record<string, unknown> = { kycStatus: { not: "NONE" } };
    if (status) where.kycStatus = status;

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        kycStatus: true,
        kycNidFront: true,
        kycNidBack: true,
        kycSelfie: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycRejectReason: true,
        createdAt: true,
      },
      orderBy: { kycSubmittedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (e) {
    console.error("Admin KYC list error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH - verify or reject a KYC submission
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, rejectReason } = body; // action: verify | reject

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required" }, { status: 400 });
    }
    if (!["verify", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, kycStatus: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.kycStatus !== "PENDING") {
      return NextResponse.json(
        { error: "এই KYC রিকোয়েস্টটি ইতিমধ্যে পর্যালোচনা করা হয়েছে" },
        { status: 400 }
      );
    }

    const newStatus = action === "verify" ? "VERIFIED" : "REJECTED";
    await db.user.update({
      where: { id: userId },
      data: {
        kycStatus: newStatus,
        kycReviewedAt: new Date(),
        kycRejectReason: action === "reject" ? (rejectReason || null) : null,
      },
    });

    // Admin log
    await db.adminLog.create({
      data: {
        adminId: user.id,
        action: `KYC_${action.toUpperCase()}`,
        target: userId,
        detail: `KYC ${action}ed for ${target.username}`,
      },
    });

    // Notify the user
    await db.notification.create({
      data: {
        userId,
        title: action === "verify"
          ? "KYC যাচাই সফল! ✅"
          : "KYC যাচাই ব্যর্থ ❌",
        message: action === "verify"
          ? "আপনার NID ও selfie যাচাই হয়েছে। এখন আপনি কাজ পোস্ট করতে পারবেন।"
          : `আপনার KYC যাচাই ব্যর্থ হয়েছে।${rejectReason ? ` কারণ: ${rejectReason}` : ""} আবার চেষ্টা করুন।`,
        type: "ANNOUNCEMENT",
      },
    });

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (e) {
    console.error("Admin KYC PATCH error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
