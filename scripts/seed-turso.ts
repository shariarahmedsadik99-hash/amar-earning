import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const url = 'libsql://amar-earning-shariarahmed0.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NDI1OTQsImlkIjoiMDFhMDY3N2EtNTkwMS03NDA3LWJkZjktNjE0NjcyYjgxZjQwIiwia2lkIjoieTRyR3A4ekV2TEQ0YnpydDE2aUVCT2h2di1zSXV1SnE0cmYyWl9RaEV3RSIsInJpZCI6IjEwZmY4YTE0LTQ3MGQtNGFhYS05ZTcxLWIzM2NkOWZjNjI1ZSJ9.-9QYmHg-pYaXFioTWbGjaMEpa63LrtD7srKeFVbR7bTi6Jfekew8Jmd2vvwbEoqb2hnc5C4JN7xLUj7ftdYZBg';

const client = createClient({ url, authToken });

async function getUserId(username: string): Promise<string> {
  const res = await client.execute({ sql: `SELECT id FROM "User" WHERE username=?`, args: [username] });
  return res.rows[0]?.id as string;
}

async function main() {
  const adminPass = await bcrypt.hash('admin123', 10);
  const workerPass = await bcrypt.hash('worker123', 10);
  const employerPass = await bcrypt.hash('employer123', 10);

  // Create users (use explicit IDs for easier linking)
  const adminId = uuid();
  const workerId = uuid();
  const employerId = uuid();

  await client.execute({ sql: `INSERT OR IGNORE INTO "User" ("id","name","username","email","passwordHash","role","referralCode") VALUES (?,?,?,?,?,?,?)`, args: [adminId, 'Admin', 'admin', 'admin@amarearning.com', adminPass, 'ADMIN', 'ADMIN001'] });
  await client.execute({ sql: `INSERT OR IGNORE INTO "Wallet" ("id","userId","balance","totalEarned") VALUES (?,?,?,?)`, args: [uuid(), adminId, 100000, 0] });

  await client.execute({ sql: `INSERT OR IGNORE INTO "User" ("id","name","username","email","passwordHash","role","referralCode") VALUES (?,?,?,?,?,?,?)`, args: [workerId, 'Demo Worker', 'worker', 'worker@amarearning.com', workerPass, 'USER', 'WORKER001'] });
  await client.execute({ sql: `INSERT OR IGNORE INTO "Wallet" ("id","userId","balance","totalEarned","pendingBalance") VALUES (?,?,?,?,?)`, args: [uuid(), workerId, 275, 500, 130] });

  await client.execute({ sql: `INSERT OR IGNORE INTO "User" ("id","name","username","email","passwordHash","role","referralCode") VALUES (?,?,?,?,?,?,?)`, args: [employerId, 'Demo Employer', 'employer', 'employer@amarearning.com', employerPass, 'USER', 'EMP001'] });
  await client.execute({ sql: `INSERT OR IGNORE INTO "Wallet" ("id","userId","balance","totalSpent") VALUES (?,?,?,?)`, args: [uuid(), employerId, 5000, 1500] });

  console.log('✅ Users created (3)');

  // Create categories
  const cats = [
    { name: 'Facebook', slug: 'facebook', icon: 'Facebook' },
    { name: 'Telegram', slug: 'telegram', icon: 'Send' },
    { name: 'Gmail', slug: 'gmail', icon: 'Mail' },
    { name: 'Identity Verification', slug: 'identity-verification', icon: 'ShieldCheck' },
    { name: 'Mobile Application', slug: 'mobile-application', icon: 'Smartphone' },
    { name: 'Review', slug: 'review', icon: 'Star' },
    { name: 'Tiktok', slug: 'tiktok', icon: 'Music' },
    { name: 'Whatsapp', slug: 'whatsapp', icon: 'MessageCircle' },
    { name: 'Youtube', slug: 'youtube', icon: 'Youtube' },
    { name: 'Twitter', slug: 'twitter', icon: 'Twitter' },
    { name: 'Toffee', slug: 'toffee', icon: 'Tv' },
    { name: 'Snapchat', slug: 'snapchat', icon: 'Camera' },
    { name: 'Airdrop/Offer Join', slug: 'airdrop-offer-join', icon: 'Gift' },
    { name: 'Answer', slug: 'answer', icon: 'MessageSquare' },
  ];

  for (const c of cats) {
    await client.execute({ sql: `INSERT OR IGNORE INTO "Category" ("id","name","slug","icon") VALUES (lower(hex(randomblob(8))),?,?,?)`, args: [c.name, c.slug, c.icon] });
  }
  console.log('✅ Categories created (14)');

  // Create job types
  const jobTypesData: Record<string, Array<{ title: string; reward: number }>> = {
    facebook: [
      { title: 'Facebook Page Follow + Invite', reward: 2 },
      { title: 'Facebook Post Share + Comment + Like', reward: 2 },
      { title: 'Facebook Birthday Wish', reward: 2 },
      { title: 'Facebook Group Join', reward: 2 },
      { title: 'Facebook Page Invite 100', reward: 2 },
      { title: 'Facebook Page Invite 500', reward: 2 },
      { title: 'Facebook Page Invite 1000', reward: 2 },
      { title: 'Facebook Id Create', reward: 5 },
      { title: 'Facebook Report', reward: 2 },
    ],
    telegram: [
      { title: 'Telegram Channel Join', reward: 2 },
      { title: 'Telegram Group Join', reward: 2 },
      { title: 'Telegram Group Post', reward: 2 },
    ],
    gmail: [
      { title: 'New Gmail Account', reward: 6 },
      { title: 'Old Gmail Account', reward: 8 },
      { title: 'Own Info Gmail Create', reward: 8 },
    ],
    'identity-verification': [
      { title: 'Application', reward: 40 },
      { title: 'Other KYC Verification', reward: 40 },
      { title: 'Website', reward: 40 },
    ],
    'mobile-application': [
      { title: 'Download and create', reward: 9 },
      { title: 'Download and visit', reward: 7 },
      { title: 'Download + install', reward: 6 },
      { title: 'Download + install + review', reward: 7 },
      { title: 'Download Only', reward: 5 },
    ],
    review: [
      { title: 'Facebook Review', reward: 2 },
      { title: 'Google Map Review', reward: 3 },
      { title: 'Play Store Review', reward: 3 },
    ],
    tiktok: [
      { title: 'Follow', reward: 2 },
      { title: 'Save', reward: 2 },
      { title: 'Live Join 1-5 min', reward: 3 },
      { title: 'Create a Video', reward: 20 },
      { title: 'Comment', reward: 2 },
      { title: 'Like + Follow', reward: 2 },
    ],
    whatsapp: [
      { title: 'Join a Channel', reward: 2 },
      { title: 'Join a Group', reward: 2 },
    ],
    youtube: [
      { title: 'Comment', reward: 2 },
      { title: 'Subscribe', reward: 2 },
      { title: 'Like', reward: 2 },
      { title: 'Like + Comment', reward: 2.4 },
      { title: 'Create a Video', reward: 100 },
      { title: 'Reels & Short', reward: 2 },
      { title: 'Watchtime 1-3 min + ads view', reward: 3 },
      { title: 'Watch Video 1-25 min', reward: 6 },
      { title: 'Watch Video + Subscribe', reward: 3 },
      { title: 'Watch Video 1-30 min', reward: 16 },
      { title: 'Watch Video 1-8 min', reward: 8 },
      { title: 'Like + Comment + Subscribe + Share', reward: 3 },
      { title: 'Watch Video 1-5 min + Subscribe + Share', reward: 4 },
      { title: 'Share a Video', reward: 2 },
      { title: 'Gmail Account + Channel Create', reward: 14 },
    ],
    twitter: [
      { title: 'Connect', reward: 2 },
      { title: 'Favourite', reward: 2 },
      { title: 'Follow', reward: 2 },
      { title: 'Follow + Favourite + Retweet', reward: 2 },
      { title: 'Follow + Like', reward: 2 },
      { title: 'New Twitter Account', reward: 8 },
      { title: 'Old Twitter Account', reward: 8 },
      { title: 'Share a Post', reward: 2 },
      { title: 'Re-Tweet', reward: 2 },
    ],
    toffee: [
      { title: 'Comment', reward: 2 },
      { title: 'Follow', reward: 2 },
      { title: 'Like', reward: 2 },
      { title: 'Watch Video 1-10 min', reward: 3 },
      { title: 'Watch Video 1-20 min', reward: 4 },
      { title: 'Views', reward: 2 },
    ],
    snapchat: [{ title: 'Follow', reward: 2 }],
    'airdrop-offer-join': [
      { title: 'Vote', reward: 2 },
      { title: 'Exchanger Offer', reward: 25 },
      { title: 'Others', reward: 20 },
      { title: 'Red Pack Claim', reward: 3 },
    ],
    answer: [
      { title: 'Answer Only', reward: 3 },
      { title: 'Long Answer + Link (30+ words)', reward: 3 },
      { title: 'Short Answer + Link (up to 30 words)', reward: 5 },
    ],
  };

  let count = 0;
  for (const [slug, types] of Object.entries(jobTypesData)) {
    const catRes = await client.execute({ sql: `SELECT id FROM "Category" WHERE slug=?`, args: [slug] });
    if (catRes.rows.length === 0) continue;
    const catId = catRes.rows[0].id as string;
    for (const jt of types) {
      await client.execute({ sql: `INSERT OR IGNORE INTO "JobType" ("id","title","reward","categoryId") VALUES (lower(hex(randomblob(8))),?,?,?)`, args: [jt.title, jt.reward, catId] });
      count++;
    }
  }
  console.log(`✅ Job types created (${count})`);

  // Create welcome notifications
  await client.execute({ sql: `INSERT OR IGNORE INTO "Notification" ("id","userId","title","message","type") VALUES (lower(hex(randomblob(8))),?,?,?,?)`, args: [workerId, 'Amar Earning-এ স্বাগতম!', 'আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। কাজ শুরু করুন।', 'ANNOUNCEMENT'] });

  console.log('\n🎉 Turso database seeded successfully!');
  console.log('Admin: admin@amarearning.com / admin123');
  console.log('Worker: worker@amarearning.com / worker123');
  console.log('Employer: employer@amarearning.com / employer123');
}

main().catch(console.error);
