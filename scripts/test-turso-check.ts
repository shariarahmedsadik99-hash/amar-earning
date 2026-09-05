import { createClient } from '@libsql/client';

const URL = 'libsql://amar-earning-shariarahmed0.aws-ap-south-1.turso.io';
const TOKEN = process.env.TURSO_AUTH_TOKEN!;

const client = createClient({ url: URL, authToken: TOKEN });

async function main() {
  console.log('=== TURSO CONNECTION TEST ===');
  try {
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables.rows.map(r => r.name).join(', '));
  } catch (e) {
    console.log('Connection FAILED:', e.message);
    process.exit(1);
  }

  // Check users
  try {
    const users = await client.execute("SELECT id, name, username, email, role, status FROM User");
    console.log('\nUsers:', users.rows.length);
    for (const u of users.rows) {
      console.log(`  - ${u.username} | ${u.email} | role: ${u.role} | status: ${u.status}`);
    }
  } catch (e) {
    console.log('User table missing:', e.message);
  }
}
main();
