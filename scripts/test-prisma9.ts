// Test Prisma without adapter - use local SQLite
import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = 'file:./db/custom.db'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log('Local users:', users.length)
  for (const u of users) {
    console.log(' ', u.username, u.email)
  }
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e.message); process.exit(1) })
