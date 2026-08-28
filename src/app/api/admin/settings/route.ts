import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, setSetting } from "@/lib/settings";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const allowed = [
      "websiteName",
      "primaryColor",
      "minWithdrawal",
      "paymentMethods",
      "jobApprovalRequired",
      "maintenanceMode",
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        let value = body[key];
        if (typeof value === "number") value = String(value);
        if (typeof value === "boolean") value = String(value);
        if (Array.isArray(value)) value = value.join(",");
        await setSetting(key as "websiteName", value as string);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Settings update error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
