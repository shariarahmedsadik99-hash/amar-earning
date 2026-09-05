import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

async function main() {
  console.log('Testing PrismaLibSql adapter...\n');
  
  const url = 'libsql://amar-earning-shariarahmed0.aws-ap-south-1.turso.io';
  const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg1MjM0NTQsImlkIjoiMDFhMDY3N2EtNTkwMS03NDA3LWJkZjktNjE0NjcyYjgxZjQwIiwia2lkIjoieTRyR3A4ekV2TEQ0YnpydDE2aUVCT2h2di1zSXV1SnE0cmYyWl9RaEV3RSIsInJpZCI6IjEwZmY4YTE0LTQ3MGQtNGFhYS05ZTcxLWIzM2NkOWZjNjI1ZSJ9.Rwvs4HJ1InUax6x3Ww2kjylj-p5Uy7aOZCjpwJRm9IQM56YDAeQxbsBgduGdCAHtk8z3Wh49Cu8OZQuHSY-yBg';
  
  const libsql = createClient({ url, authToken });
  const adapter = new PrismaLibSql(libsql);
  const prisma = new PrismaClient({ adapter });
  
  try {
    // Test 1: Find user
    const user = await prisma.user.findFirst({
      where: { email: 'admin@amarearning.com' },
      select: { id: true, name: true, username: true, email: true, role: true }
    });
    console.log('1. User found:', user ? '✅' : '❌', user);
    
    // Test 2: Find wallet
    if (user) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: user.id }
      });
      console.log('2. Wallet:', wallet ? '✅ balance=৳' + wallet.balance : '❌ No wallet');
    }
    
    // Test 3: Count users
    const count = await prisma.user.count();
    console.log('3. User count:', count);
    
    // Test 4: Count categories
    const catCount = await prisma.category.count();
    console.log('4. Categories:', catCount);
    
    console.log('\n✅ PrismaLibSql adapter works perfectly!');
  } catch (e) {
    console.error('❌ Prisma error:', e.message);
  }
}
main().catch(console.error);
