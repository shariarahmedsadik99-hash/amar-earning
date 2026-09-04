import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;
    
    // Test 1: Check env vars
    if (!tursoUrl) {
      return NextResponse.json({ step: 'env', error: 'TURSO_DATABASE_URL not set' }, { status: 500 });
    }
    
    // Test 2: Connect to Turso directly with libsql
    const { createClient } = await import('@libsql/client');
    const libsql = createClient({ url: tursoUrl, authToken: tursoToken });
    
    const result = await libsql.execute("SELECT COUNT(*) as count FROM User");
    const userCount = result.rows[0].count;
    
    // Test 3: Now try with Prisma adapter
    try {
      const { PrismaClient } = await import('@prisma/client');
      const { PrismaLibSql } = await import('@prisma/adapter-libsql');
      
      const adapter = new PrismaLibSql(libsql);
      const prisma = new PrismaClient({ adapter });
      
      const prismaCount = await prisma.user.count();
      
      return NextResponse.json({ 
        step: 'all', 
        libsqlDirect: userCount,
        prismaAdapter: prismaCount,
        tursoUrl: tursoUrl,
        ok: true
      });
    } catch (prismaErr) {
      return NextResponse.json({ 
        step: 'prisma',
        libsqlDirect: userCount,
        prismaError: prismaErr.message,
        prismaCode: prismaErr.code,
        prismaStack: prismaErr.stack?.split('\n').slice(0, 5).join('\n'),
        ok: false
      }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ 
      step: 'libsql',
      error: e.message,
      stack: e.stack?.split('\n').slice(0, 5).join('\n')
    }, { status: 500 });
  }
}
