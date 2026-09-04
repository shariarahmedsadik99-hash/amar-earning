import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const client = createClient({
  url: 'libsql://amar-earning-shariarahmed0.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0NDI1OTQsImlkIjoiMDFhMDY3N2EtNTkwMS03NDA3LWJkZjktNjE0NjcyYjgxZjQwIiwia2lkIjoieTRyR3A4ekV2TEQ0YnpydDE2aUVCT2h2di1zSXV1SnE0cmYyWl9RaEV3RSIsInJpZCI6IjEwZmY4YTE0LTQ3MGQtNGFhYS05ZTcxLWIzM2NkOWZjNjI1ZSJ9.-9QYmHg-pYaXFioTWbGjaMEpa63LrtD7srKeFVbR7bTi6Jfekew8Jmd2vvwbEoqb2hnc5C4JN7xLUj7ftdYZBg',
});

async function exec(sql: string, args: any[] = []) {
  try { await client.execute({ sql, args }); } catch (e) { if (!e.message.includes('UNIQUE')) console.error('ERR:', e.message, sql.slice(0,60)); }
}

async function main() {
  const ap = await bcrypt.hash('admin123', 10);
  const wp = await bcrypt.hash('worker123', 10);
  const ep = await bcrypt.hash('employer123', 10);
  const aid = uuid(), wid = uuid(), eid = uuid();

  await exec(`INSERT OR IGNORE INTO "User" ("id","name","username","email","passwordHash","role","referralCode") VALUES (?,?,?,?,?,?,?)`, [aid,'Admin','admin','admin@amarearning.com',ap,'ADMIN','ADMIN001']);
  await exec(`INSERT OR IGNORE INTO "Wallet" ("id","userId","balance") VALUES (?,?,?)`, [uuid(),aid,100000]);
  await exec(`INSERT OR IGNORE INTO "User" ("id","name","username","email","passwordHash","role","referralCode") VALUES (?,?,?,?,?,?,?)`, [wid,'Demo Worker','worker','worker@amarearning.com',wp,'USER','WORKER001']);
  await exec(`INSERT OR IGNORE INTO "Wallet" ("id","userId","balance","totalEarned","pendingBalance") VALUES (?,?,?,?,?)`, [uuid(),wid,275,500,130]);
  await exec(`INSERT OR IGNORE INTO "User" ("id","name","username","email","passwordHash","role","referralCode") VALUES (?,?,?,?,?,?,?)`, [eid,'Demo Employer','employer','employer@amarearning.com',ep,'USER','EMP001']);
  await exec(`INSERT OR IGNORE INTO "Wallet" ("id","userId","balance","totalSpent") VALUES (?,?,?,?)`, [uuid(),eid,5000,1500]);
  console.log('✅ Users (3)');

  // Categories with fixed IDs
  const cats: [string,string,string,string][] = [
    ['c1','Facebook','facebook','Facebook'],
    ['c2','Telegram','telegram','Send'],
    ['c3','Gmail','gmail','Mail'],
    ['c4','Identity Verification','identity-verification','ShieldCheck'],
    ['c5','Mobile Application','mobile-application','Smartphone'],
    ['c6','Review','review','Star'],
    ['c7','Tiktok','tiktok','Music'],
    ['c8','Whatsapp','whatsapp','MessageCircle'],
    ['c9','Youtube','youtube','Youtube'],
    ['c10','Twitter','twitter','Twitter'],
    ['c11','Toffee','toffee','Tv'],
    ['c12','Snapchat','snapchat','Camera'],
    ['c13','Airdrop/Offer Join','airdrop-offer-join','Gift'],
    ['c14','Answer','answer','MessageSquare'],
  ];
  for (const [id,name,slug,icon] of cats) {
    await exec(`INSERT OR IGNORE INTO "Category" ("id","name","slug","icon") VALUES (?,?,?,?)`, [id,name,slug,icon]);
  }
  console.log('✅ Categories (14)');

  const jt: Record<string,[string,number][]> = {
    c1: [['Facebook Page Follow + Invite',2],['Facebook Post Share + Comment + Like',2],['Facebook Birthday Wish',2],['Facebook Group Join',2],['Facebook Page Invite 100',2],['Facebook Page Invite 500',2],['Facebook Page Invite 1000',2],['Facebook Id Create',5],['Facebook Report',2]],
    c2: [['Telegram Channel Join',2],['Telegram Group Join',2],['Telegram Group Post',2]],
    c3: [['New Gmail Account',6],['Old Gmail Account',8],['Own Info Gmail Create',8]],
    c4: [['Application',40],['Other KYC Verification',40],['Website',40]],
    c5: [['Download and create',9],['Download and visit',7],['Download + install',6],['Download + install + review',7],['Download Only',5]],
    c6: [['Facebook Review',2],['Google Map Review',3],['Play Store Review',3]],
    c7: [['Follow',2],['Save',2],['Live Join 1-5 min',3],['Create a Video',20],['Comment',2],['Like + Follow',2]],
    c8: [['Join a Channel',2],['Join a Group',2]],
    c9: [['Comment',2],['Subscribe',2],['Like',2],['Like + Comment',2.4],['Create a Video',100],['Reels & Short',2],['Watchtime 1-3 min + ads view',3],['Watch Video 1-25 min',6],['Watch Video + Subscribe',3],['Watch Video 1-30 min',16],['Watch Video 1-8 min',8],['Like + Comment + Subscribe + Share',3],['Watch Video 1-5 min + Subscribe + Share',4],['Share a Video',2],['Gmail Account + Channel Create',14]],
    c10: [['Connect',2],['Favourite',2],['Follow',2],['Follow + Favourite + Retweet',2],['Follow + Like',2],['New Twitter Account',8],['Old Twitter Account',8],['Share a Post',2],['Re-Tweet',2]],
    c11: [['Comment',2],['Follow',2],['Like',2],['Watch Video 1-10 min',3],['Watch Video 1-20 min',4],['Views',2]],
    c12: [['Follow',2]],
    c13: [['Vote',2],['Exchanger Offer',25],['Others',20],['Red Pack Claim',3]],
    c14: [['Answer Only',3],['Long Answer + Link (30+ words)',3],['Short Answer + Link (up to 30 words)',5]],
  };
  let cnt = 0;
  for (const [cid, types] of Object.entries(jt)) {
    for (const [title, reward] of types) {
      await exec(`INSERT OR IGNORE INTO "JobType" ("id","title","reward","categoryId") VALUES (?,?,?,?)`, [uuid(),title,reward,cid]);
      cnt++;
    }
  }
  console.log(`✅ Job types (${cnt})`);

  await exec(`INSERT OR IGNORE INTO "Notification" ("id","userId","title","message","type") VALUES (?,?,?,?,?)`, [uuid(),wid,'Amar Earning-এ স্বাগতম!','আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। কাজ শুরু করুন।','ANNOUNCEMENT']);

  console.log('\n🎉 Seeded!');
  console.log('admin@amarearning.com / admin123');
  console.log('worker@amarearning.com / worker123');
  console.log('employer@amarearning.com / employer123');
}
main().catch(console.error);
