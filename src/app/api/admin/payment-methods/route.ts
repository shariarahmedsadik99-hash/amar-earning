import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET - fetch current payment methods config (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const setting = await db.setting.findUnique({
      where: { key: "paymentMethodsConfig" },
    });

    let methods = [];
    if (setting?.value) {
      try {
        methods = JSON.parse(setting.value);
      } catch {
        methods = [];
      }
    }

    // If empty, return defaults
    if (methods.length === 0) {
      const defaultMethods = await import("@/app/api/payment-methods/route");
      methods = defaultMethods.getDefaultMethods();
    }

    return NextResponse.json({ methods });
  } catch (e) {
    console.error("Admin payment methods GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT - save full payment methods config
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { methods } = await req.json();

    if (!Array.isArray(methods)) {
      return NextResponse.json({ error: "Methods must be an array" }, { status: 400 });
    }

    // Validate each method
    for (const m of methods) {
      if (!m.key || !m.labelEn || !m.number) {
        return NextResponse.json({ error: "Each method needs key, label, and number" }, { status: 400 });
      }
    }

    const config = JSON.stringify(methods);

    await db.setting.upsert({
      where: { key: "paymentMethodsConfig" },
      create: { key: "paymentMethodsConfig", value: config },
      update: { value: config },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin payment methods PUT error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
