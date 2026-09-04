import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Turso connection info from separate env vars
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || ''
  const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || ''

  // If Turso URL is available, use the adapter
  if (tursoUrl.startsWith('libsql://')) {
    const libsql = createClient({ url: tursoUrl, authToken: tursoToken })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite fallback
  const localUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  return new PrismaClient({
    datasources: { db: { url: localUrl } },
    log: process.env.NODE_ENV !== 'production' ? ['error'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
