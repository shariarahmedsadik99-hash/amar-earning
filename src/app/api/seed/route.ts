import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Seed error:", e);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Seed error:", e);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
