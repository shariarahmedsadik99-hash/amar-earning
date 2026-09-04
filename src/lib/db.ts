import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "file:./db/custom.db"

  // For Turso/libSQL
  if (url.startsWith('libsql://')) {
    const authToken = process.env.DATABASE_AUTH_TOKEN
    const libsql = createClient({ url, authToken })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite fallback
  return new PrismaClient({
    datasources: { db: { url } },
    log: ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
