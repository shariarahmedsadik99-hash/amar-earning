import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (e) {
    console.error("Categories error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
