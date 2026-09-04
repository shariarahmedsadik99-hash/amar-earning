import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg1MjM0NTQsImlkIjoiMDFhMDY3N2EtNTkwMS03NDA3LWJkZjktNjE0NjcyYjgxZjQwIiwia2lkIjoieTRyR3A4ekV2TEQ0YnpydDE2aUVCT2h2di1zSXV1SnE0cmYyWl9RaEV3RSIsInJpZCI6IjEwZmY4YTE0LTQ3MGQtNGFhYS05ZTcxLWIzM2NkOWZjNjI1ZSJ9.Rwvs4HJ1InUax6x3Ww2kjylj-p5Uy7aOZCjpwJRm9IQM56YDAeQxbsBgduGdCAHtk8z3Wh49Cu8OZQuHSY-yBg';
const URL = 'libsql://amar-earning-shariarahmed0.aws-ap-south-1.turso.io';

const client = createClient({ url: URL, authToken: TOKEN });

async function main() {
  console.log('=== TURSO DATABASE FULL CHECK ===\n');

  // 1. Connection test
  try {
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('1. Connection: ✅ OK');
    console.log('   Tables:', tables.rows.map(r => r.name).join(', '));
  } catch (e) {
    console.log('1. Connection: ❌ FAILED -', e.message);
    return;
  }

  // 2. Users
  const users = await client.execute("SELECT id, name, username, email, passwordHash, role, status FROM User");
  console.log('\n2. Users:', users.rows.length);
  for (const u of users.rows) {
    const valid = await bcrypt.compare(u.username === 'admin' ? 'admin123' : u.username === 'worker' ? 'worker123' : 'employer123', u.passwordHash as string);
    console.log(`   ${u.username} | ${u.email} | role: ${u.role} | status: ${u.status} | pass: ${valid ? '✅' : '❌'}`);
  }

  // 3. Wallets
  console.log('\n3. Wallets:');
  for (const u of users.rows) {
    const w = await client.execute({ sql: "SELECT balance, totalEarned, totalSpent, pendingBalance FROM Wallet WHERE userId = ?", args: [u.id as string] });
    if (w.rows.length > 0) {
      console.log(`   ${u.username}: balance=৳${w.rows[0].balance} earned=৳${w.rows[0].totalEarned} spent=৳${w.rows[0].totalSpent} pending=৳${w.rows[0].pendingBalance}`);
    } else {
      console.log(`   ${u.username}: ❌ NO WALLET`);
    }
  }

  // 4. Categories
  const cats = await client.execute("SELECT id, name, slug FROM Category");
  console.log('\n4. Categories:', cats.rows.length);

  // 5. Job Types
  const jts = await client.execute("SELECT COUNT(*) as count FROM JobType");
  console.log('5. Job Types:', jts.rows[0].count);

  // 6. Settings
  const settings = await client.execute("SELECT key, value FROM Setting");
  console.log('\n6. Settings:', settings.rows.length);
  for (const s of settings.rows) {
    console.log(`   ${s.key} = ${s.value}`);
  }

  // 7. Test login query (exactly like the API does)
  console.log('\n7. Login simulation (admin):');
  const loginRes = await client.execute({
    sql: "SELECT id, name, username, email, passwordHash, role, status, referralCode FROM User WHERE email = ? OR username = ?",
    args: ['admin@amarearning.com', 'admin@amarearning.com'],
  });
  if (loginRes.rows.length > 0) {
    const u = loginRes.rows[0];
    const valid = await bcrypt.compare('admin123', u.passwordHash as string);
    console.log(`   Found: ${u.username} (${u.email})`);
    console.log(`   Role: ${u.role}, Status: ${u.status}`);
    console.log(`   Password: ${valid ? '✅ Correct' : '❌ Wrong'}`);

    // Check wallet for /api/auth/me
    const wallet = await client.execute({ sql: "SELECT balance, totalEarned, totalSpent, pendingBalance FROM Wallet WHERE userId = ?", args: [u.id as string] });
    console.log(`   Wallet: ${wallet.rows.length > 0 ? '✅ Found (৳' + wallet.rows[0].balance + ')' : '❌ NOT FOUND'}`);

    // Check notifications
    const notifs = await client.execute({ sql: "SELECT COUNT(*) as count FROM Notification WHERE userId = ?", args: [u.id as string] });
    console.log(`   Notifications: ${notifs.rows[0].count}`);
  } else {
    console.log('   ❌ User not found!');
  }

  console.log('\n=== CHECK COMPLETE ===');
}
main().catch(console.error);
