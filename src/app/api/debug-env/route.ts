import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL || 'NOT SET',
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || 'NOT SET',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'SET (' + process.env.TURSO_AUTH_TOKEN.substring(0, 20) + '...)' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  });
}
