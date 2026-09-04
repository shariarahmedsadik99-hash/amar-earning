// Simulate the exact login API flow
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg1MjM0NTQsImlkIjoiMDFhMDY3N2EtNTkwMS03NDA3LWJkZjktNjE0NjcyYjgxZjQwIiwia2lkIjoieTRyR3A4ekV2TEQ0YnpydDE2aUVCT2h2di1zSXV1SnE0cmYyWl9RaEV3RSIsInJpZCI6IjEwZmY4YTE0LTQ3MGQtNGFhYS05ZTcxLWIzM2NkOWZjNjI1ZSJ9.Rwvs4HJ1InUax6x3Ww2kjylj-p5Uy7aOZCjpwJRm9IQM56YDAeQxbsBgduGdCAHtk8z3Wh49Cu8OZQuHSY-yBg';
const URL = 'libsql://amar-earning-shariarahmed0.aws-ap-south-1.turso.io';

const client = createClient({ url: URL, authToken: TOKEN });

async function simulateLogin(identifier: string, password: string) {
  console.log(`\n=== Login: ${identifier} / ${password} ===`);
  
  // Step 1: Find user (like login API does)
  try {
    const res = await client.execute({
      sql: 'SELECT id, name, username, email, "passwordHash", role, status FROM "User" WHERE email = ? OR username = ?',
      args: [identifier, identifier],
    });
    
    if (res.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = res.rows[0];
    console.log('✅ User found:', user.username, user.email, 'role:', user.role, 'status:', user.status);
    
    // Step 2: Check password
    const valid = await bcrypt.compare(password, user.passwordHash as string);
    console.log('Password:', valid ? '✅ Correct' : '❌ Wrong');
    
    if (!valid) return;
    
    // Step 3: Check status
    if (user.status === 'SUSPENDED') {
      console.log('❌ Account suspended');
      return;
    }
    
    // Step 4: Check wallet (like /api/auth/me does)
    const wallet = await client.execute({
      sql: 'SELECT balance, "totalEarned", "totalSpent", "pendingBalance" FROM "Wallet" WHERE "userId" = ?',
      args: [user.id as string],
    });
    
    if (wallet.rows.length === 0) {
      console.log('❌ No wallet found - THIS CAUSES SERVER ERROR');
      return;
    }
    console.log('✅ Wallet: balance=৳' + wallet.rows[0].balance);
    
    // Step 5: Check notifications
    const notifs = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM "Notification" WHERE "userId" = ?',
      args: [user.id as string],
    });
    console.log('✅ Notifications:', notifs.rows[0].count);
    
    console.log('\n🎉 Login should work! All checks passed.');
  } catch (e) {
    console.log('❌ DATABASE ERROR:', e.message);
  }
}

// Test all 3 accounts
await simulateLogin('admin@amarearning.com', 'admin123');
await simulateLogin('worker@amarearning.com', 'worker123');
await simulateLogin('employer@amarearning.com', 'employer123');
