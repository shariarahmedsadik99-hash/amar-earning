import { createClient } from '@libsql/client';

const URL = 'libsql://amar-earning-shariarahmed0.aws-ap-south-1.turso.io';
const TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg1MjM0NTQsImlkIjoiMDFhMDY3N2EtNTkwMS03NDA3LWJkZjktNjE0NjcyYjgxZjQwIiwia2lkIjoieTRyR3A4ekV2TEQ0YnpydDE2aUVCT2h2di1zSXV1SnE0cmYyWl9RaEV3RSIsInJpZCI6IjEwZmY4YTE0LTQ3MGQtNGFhYS05ZTcxLWIzM2NkOWZjNjI1ZSJ9.Rwvs4HJ1InUax6x3Ww2kjylj-p5Uy7aOZCjpwJRm9IQM56YDAeQxbsBgduGdCAHtk8z3Wh49Cu8OZQuHSY-yBg';
const client = createClient({ url: URL, authToken: TOKEN });

const w = await client.execute({
  sql: 'SELECT u.username, w.balance, w."totalEarned" FROM User u LEFT JOIN Wallet w ON w.userId = u.id WHERE u.username = \'testuser123\'',
});
console.log('NEW USER WALLET:', JSON.stringify(w.rows[0]));

const tx = await client.execute({
  sql: 'SELECT type, amount, description FROM "Transaction" WHERE userId = (SELECT id FROM User WHERE username = \'testuser123\')',
});
console.log('TRANSACTIONS:', tx.rows.length === 0 ? 'NONE (signup bonus removed - correct!)' : JSON.stringify(tx.rows));

// Cleanup
await client.execute({ sql: 'DELETE FROM Wallet WHERE userId = (SELECT id FROM User WHERE username = \'testuser123\')' });
await client.execute({ sql: 'DELETE FROM Notification WHERE userId = (SELECT id FROM User WHERE username = \'testuser123\')' });
await client.execute({ sql: 'DELETE FROM User WHERE username = \'testuser123\'' });
console.log('Test user cleaned up.');
