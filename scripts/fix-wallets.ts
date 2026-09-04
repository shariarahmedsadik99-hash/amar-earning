import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const client = createClient({
  url: 'libsql://amar-earning-shariarahmed0.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0OTk3MTUsImlkIjoiMDFhMDY3N2EtNTkwMS03NDA3LWJkZjktNjE0NjcyYjgxZjQwIiwia2lkIjoieTRyR3A4ekV2TEQ0YnpydDE2aUVCT2h2di1zSXV1SnE0cmYyWl9RaEV3RSIsInJpZCI6IjEwZmY4YTE0LTQ3MGQtNGFhYS05ZTcxLWIzM2NkOWZjNjI1ZSJ9.uVRIBkPJWaPux7IX-hVZ0T9JKPw1gP881j-FfLYzxE5tCnz5k0Wx9r8WA9meYz5RQ4rB5R-nJ1YPdJUMyo7SCw',
});

const now = new Date().toISOString();

function randomId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function main() {
  const users = await client.execute("SELECT id, username FROM User");
  console.log('Users:', users.rows.length);

  for (const u of users.rows) {
    const existing = await client.execute({
      sql: "SELECT id FROM Wallet WHERE userId = ?",
      args: [u.id as string],
    });

    if (existing.rows.length === 0) {
      const balance = u.username === 'admin' ? 100000 : u.username === 'worker' ? 275 : 5000;
      const totalEarned = u.username === 'worker' ? 500 : 0;
      const totalSpent = u.username === 'employer' ? 1500 : 0;
      const pendingBalance = u.username === 'worker' ? 130 : 0;

      await client.execute({
        sql: 'INSERT INTO "Wallet" ("id","userId","balance","totalEarned","totalSpent","pendingBalance","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?)',
        args: [randomId(), u.id, balance, totalEarned, totalSpent, pendingBalance, now, now],
      });
      console.log(`✅ Wallet created for ${u.username}: ৳${balance}`);
    } else {
      console.log(`⏭ Wallet exists for ${u.username}`);
    }
  }

  // Verify
  for (const u of users.rows) {
    const w = await client.execute({
      sql: "SELECT balance FROM Wallet WHERE userId = ?",
      args: [u.id as string],
    });
    console.log(`  ${u.username}: ৳${w.rows[0]?.balance || 'NO WALLET'}`);
  }
  console.log('\n✅ All wallets fixed!');
}
main().catch(console.error);
