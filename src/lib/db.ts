import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "file:./db/custom.db"

  // For Turso/libSQL, we create a regular PrismaClient with the URL
  // The adapter approach requires async init which doesn't work with the current architecture
  // Instead, we pass the full URL with authToken as query param
  let dbUrl = url
  if (url.startsWith('libsql://') && process.env.DATABASE_AUTH_TOKEN) {
    // Prisma supports libSQL URLs with authToken as query param via the driver adapter
    // But for simplicity, we use direct connection with embedded token
    const separator = url.includes('?') ? '&' : '?'
    dbUrl = `${url}${separator}authToken=${process.env.DATABASE_AUTH_TOKEN}`
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
