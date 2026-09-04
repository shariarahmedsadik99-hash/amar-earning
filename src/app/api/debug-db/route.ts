import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaLibSql } = await import('@prisma/adapter-libsql');
    const { createClient } = await import('@libsql/client');
    
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;
    
    if (!tursoUrl) {
      return NextResponse.json({ error: 'TURSO_DATABASE_URL not set' }, { status: 500 });
    }
    
    const libsql = createClient({ url: tursoUrl, authToken: tursoToken });
    const adapter = new PrismaLibSql(libsql);
    const prisma = new PrismaClient({ adapter });
    
    const count = await prisma.user.count();
    return NextResponse.json({ ok: true, userCount: count, tursoUrl: tursoUrl });
  } catch (e) {
    return NextResponse.json({ 
      ok: false, 
      error: e.message,
      stack: e.stack?.split('\n').slice(0, 10).join('\n')
    }, { status: 500 });
  }
}
