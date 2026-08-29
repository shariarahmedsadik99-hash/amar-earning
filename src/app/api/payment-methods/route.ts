import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - public payment methods with colors and numbers (admin-configured)
export async function GET() {
  try {
    const setting = await db.setting.findUnique({
      where: { key: "paymentMethodsConfig" },
    });

    let methods: Array<{
      key: string;
      labelBn: string;
      labelEn: string;
      number: string;
      type: string; // PERSONAL | MERCHANT
      color: string;
      textColor: string;
      logo: string; // emoji or icon name
      instructionsBn: string;
      instructionsEn: string;
      active: boolean;
    }>;

    if (setting?.value) {
      try {
        methods = JSON.parse(setting.value);
      } catch {
        methods = getDefaultMethods();
      }
    } else {
      methods = getDefaultMethods();
    }

    // Return only active methods
    return NextResponse.json({ methods: methods.filter((m) => m.active) });
  } catch (e) {
    console.error("Payment methods error:", e);
    return NextResponse.json({ methods: getDefaultMethods() }, { status: 200 });
  }
}

export function getDefaultMethods() {
  return [
    {
      key: "BKASH",
      labelBn: "বিকাশ",
      labelEn: "bKash",
      number: "01XXXXXXXXX",
      type: "PERSONAL",
      color: "#E2136E",
      textColor: "#ffffff",
      logo: "📱",
      instructionsBn: "বিকাশ অ্যাপ বা পার্সোনাল নম্বরে টাকা পাঠান, তারপর ট্রানজেকশন আইডি দিন।",
      instructionsEn: "Send money via bKash app or personal number, then provide transaction ID.",
      active: true,
    },
    {
      key: "NAGAD",
      labelBn: "নগদ",
      labelEn: "Nagad",
      number: "01XXXXXXXXX",
      type: "PERSONAL",
      color: "#EC1C24",
      textColor: "#ffffff",
      logo: "💰",
      instructionsBn: "নগদ অ্যাপ বা পার্সোনাল নম্বরে টাকা পাঠান, তারপর ট্রানজেকশন আইডি দিন।",
      instructionsEn: "Send money via Nagad app or personal number, then provide transaction ID.",
      active: true,
    },
    {
      key: "ROCKET",
      labelBn: "রকেট",
      labelEn: "Rocket",
      number: "01XXXXXXXXX",
      type: "PERSONAL",
      color: "#8B2C8B",
      textColor: "#ffffff",
      logo: "🚀",
      instructionsBn: "রকেট অ্যাপ বা পার্সোনাল নম্বরে টাকা পাঠান, তারপর ট্রানজেকশন আইডি দিন।",
      instructionsEn: "Send money via Rocket app or personal number, then provide transaction ID.",
      active: true,
    },
  ];
}
