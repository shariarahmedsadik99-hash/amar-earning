import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Check for Turso env vars
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl && tursoUrl.startsWith('libsql://')) {
    const libsql = createClient({ url: tursoUrl, authToken: tursoToken })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Also check DATABASE_URL for libsql
  const dbUrl = process.env.DATABASE_URL || ''
  if (dbUrl.startsWith('libsql://')) {
    const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
    const libsql = createClient({ url: dbUrl, authToken })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite fallback
  const localUrl = dbUrl || 'file:./db/custom.db'
  return new PrismaClient({
    datasources: { db: { url: localUrl } },
    log: ['error'],
  })
}

// Initialize immediately
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
