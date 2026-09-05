import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

process.env.DATABASE_URL = 'file:./db/custom.db'

const libsql = createClient({
  url: 'libsql://amar-earning-shariarahmed0.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg1MjM0NTQsImlkIjoiMDFhMDY3N2EtNTkwMS03NDA3LWJkZjktNjE0NjcyYjgxZjQwIiwia2lkIjoieTRyR3A4ekV2TEQ0YnpydDE2aUVCT2h2di1zSXV1SnE0cmYyWl9RaEV3RSIsInJpZCI6IjEwZmY4YTE0LTQ3MGQtNGFhYS05ZTcxLWIzM2NkOWZjNjI1ZSJ9.Rwvs4HJ1InUax6x3Ww2kjylj-p5Uy7aOZCjpwJRm9IQM56YDAeQxbsBgduGdCAHtk8z3Wh49Cu8OZQuHSY-yBg',
})
const adapter = new PrismaLibSql(libsql)

// Use datasourceUrl instead of datasources
const prisma = new PrismaClient({
  adapter,
  datasourceUrl: 'file:./db/custom.db',
})

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@amarearning.com' },
  })
  console.log('User:', user?.username || 'not found')
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1) })
