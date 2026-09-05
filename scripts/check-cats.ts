import { createClient } from '@libsql/client';
const client = createClient({
  url: 'libsql://amar-earning-shariarahmed0.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg1MjM0NTQsImlkIjoiMDFhMDY3N2EtNTkwMS03NDA3LWJkZjktNjE0NjcyYjgxZjQwIiwia2lkIjoieTRyR3A4ekV2TEQ0YnpydDE2aUVCT2h2di1zSXV1SnE0cmYyWl9RaEV3RSIsInJpZCI6IjEwZmY4YTE0LTQ3MGQtNGFhYS05ZTcxLWIzM2NkOWZjNjI1ZSJ9.Rwvs4HJ1InUax6x3Ww2kjylj-p5Uy7aOZCjpwJRm9IQM56YDAeQxbsBgduGdCAHtk8z3Wh49Cu8OZQuHSY-yBg',
});

console.log('=== CATEGORIES ===');
const cats = await client.execute('SELECT id, name, slug FROM Category ORDER BY name');
console.log('Count:', cats.rows.length);
for (const c of cats.rows) {
  const jtCount = await client.execute({ sql: 'SELECT COUNT(*) as n FROM JobType WHERE categoryId = ?', args: [c.id as string] });
  console.log(`  ${c.name} (${c.slug}) - ${jtCount.rows[0].n} job types`);
}

console.log('\n=== JOBS ===');
const jobs = await client.execute('SELECT id, title, status, categoryId FROM Job ORDER BY createdAt DESC LIMIT 10');
console.log('Recent jobs:');
for (const j of jobs.rows) {
  console.log(`  ${j.title} | status=${j.status} | categoryId=${j.categoryId}`);
}
