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
      phone: string; // contact/help-line phone number (separate from payment number)
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
        const parsed = JSON.parse(setting.value);
        // Normalize: ensure every method has a `phone` field (backward-compat)
        methods = parsed.map((m: Record<string, unknown>) => ({
          key: String(m.key ?? ""),
          labelBn: String(m.labelBn ?? ""),
          labelEn: String(m.labelEn ?? ""),
          number: String(m.number ?? ""),
          phone: String(m.phone ?? ""),
          type: String(m.type ?? "PERSONAL"),
          color: String(m.color ?? "#22c55e"),
          textColor: String(m.textColor ?? "#ffffff"),
          logo: String(m.logo ?? "💳"),
          instructionsBn: String(m.instructionsBn ?? ""),
          instructionsEn: String(m.instructionsEn ?? ""),
          active: m.active !== false,
        }));
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
      phone: "01XXXXXXXXX",
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
      phone: "01XXXXXXXXX",
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
      phone: "01XXXXXXXXX",
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
