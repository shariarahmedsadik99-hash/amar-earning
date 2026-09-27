import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const VALID_DOC_TYPES = ["NID", "LICENSE", "PASSPORT"];

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
        kycDocType: true,
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

// POST - submit KYC with document type selection
// Body: { docType: "NID"|"LICENSE"|"PASSPORT", docFront, docBack?, selfie }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { docType, docFront, docBack, selfie } = body;

    if (!VALID_DOC_TYPES.includes(docType)) {
      return NextResponse.json(
        { error: "ডকুমেন্ট টাইপ সঠিক নয় (NID, LICENSE, বা PASSPORT)" },
        { status: 400 }
      );
    }
    if (!docFront || !selfie) {
      return NextResponse.json(
        { error: "ডকুমেন্ট ছবি এবং selfie আবশ্যক" },
        { status: 400 }
      );
    }
    // NID requires back image; LICENSE and PASSPORT only need front
    if (docType === "NID" && !docBack) {
      return NextResponse.json(
        { error: "NID এর জন্য সামনে ও পেছনে উভয় ছবি আবশ্যক" },
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

    await db.user.update({
      where: { id: user.id },
      data: {
        kycStatus: "PENDING",
        kycDocType: docType,
        kycNidFront: docFront,
        kycNidBack: docType === "NID" ? (docBack || null) : null,
        kycSelfie: selfie,
        kycSubmittedAt: new Date(),
        kycReviewedAt: null,
        kycRejectReason: null,
      },
    });

    // Notify admins
    const docTypeLabel: Record<string, string> = {
      NID: "NID",
      LICENSE: "ড্রাইভিং লাইসেন্স",
      PASSPORT: "পাসপোর্ট",
    };
    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "নতুন KYC যাচাইয়ের অনুরোধ",
          message: `${user.name} (@${user.username}) ${docTypeLabel[docType] || docType} ও selfie জমা দিয়েছেন। যাচাই করুন।`,
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
