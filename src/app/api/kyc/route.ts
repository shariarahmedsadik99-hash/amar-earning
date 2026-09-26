import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - current user's KYC status
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const full = await db.user.findUnique({
      where: { id: user.id },
      select: {
        kycStatus: true,
        kycNidFront: true,
        kycNidBack: true,
        kycSelfie: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycRejectReason: true,
      },
    });

    return NextResponse.json({ kyc: full });
  } catch (e) {
    console.error("KYC GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - submit KYC (NID front, NID back, selfie URLs from R2)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { nidFront, nidBack, selfie } = body;

    if (!nidFront || !nidBack || !selfie) {
      return NextResponse.json(
        { error: "NID front, NID back, এবং selfie সব আবশ্যক" },
        { status: 400 }
      );
    }

    // If already verified, don't allow re-submit
    const existing = await db.user.findUnique({
      where: { id: user.id },
      select: { kycStatus: true },
    });
    if (existing?.kycStatus === "VERIFIED") {
      return NextResponse.json(
        { error: "আপনার KYC ইতিমধ্যে যাচাই হয়েছে" },
        { status: 400 }
      );
    }
    // If pending, allow re-submit (overwrites previous submission)
    await db.user.update({
      where: { id: user.id },
      data: {
        kycStatus: "PENDING",
        kycNidFront: nidFront,
        kycNidBack: nidBack,
        kycSelfie: selfie,
        kycSubmittedAt: new Date(),
        kycReviewedAt: null,
        kycRejectReason: null,
      },
    });

    // Notify admins
    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "নতুন KYC যাচাইয়ের অনুরোধ",
          message: `${user.name} (@${user.username}) NID ও selfie জমা দিয়েছেন। যাচাই করুন।`,
          type: "ANNOUNCEMENT",
        },
      });
    }

    return NextResponse.json({ ok: true, status: "PENDING" });
  } catch (e) {
    console.error("KYC POST error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
