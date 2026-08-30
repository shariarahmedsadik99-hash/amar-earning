import { db } from "./db";
import { hashPassword } from "./auth";

export async function seedDatabase() {
  // Check if already seeded
  const userCount = await db.user.count();
  if (userCount > 0) {
    // Still ensure categories exist
    await ensureCategories();
    await ensureSettings();
    await ensureAdmin();
    return;
  }

  // Create admin user
  const adminPassword = await hashPassword("admin123");
  const admin = await db.user.create({
    data: {
      name: "Admin",
      username: "admin",
      email: "admin@amarearning.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      referralCode: "ADMIN001",
      wallet: {
        create: {
          balance: 100000,
          totalEarned: 0,
          totalSpent: 0,
          pendingBalance: 0,
        },
      },
    },
  });

  // Create demo worker user
  const workerPassword = await hashPassword("worker123");
  const worker = await db.user.create({
    data: {
      name: "Demo Worker",
      username: "worker",
      email: "worker@amarearning.com",
      passwordHash: workerPassword,
      referralCode: "WORKER001",
      wallet: {
        create: {
          balance: 250,
          totalEarned: 500,
          totalSpent: 0,
          pendingBalance: 30,
        },
      },
    },
  });

  // Create demo employer user
  const employerPassword = await hashPassword("employer123");
  const employer = await db.user.create({
    data: {
      name: "Demo Employer",
      username: "employer",
      email: "employer@amarearning.com",
      passwordHash: employerPassword,
      referralCode: "EMP001",
      wallet: {
        create: {
          balance: 5000,
          totalEarned: 0,
          totalSpent: 1500,
          pendingBalance: 0,
        },
      },
    },
  });

  await ensureCategories();
  await ensureSettings();

  // Create sample jobs
  const categories = await db.category.findMany();
  const catMap: Record<string, string> = {};
  for (const c of categories) catMap[c.slug] = c.id;

  const sampleJobs = [
    {
      title: "Facebook Page Follow",
      description: "Follow our Facebook page and like the latest 3 posts.",
      instructions:
        "1. Visit our Facebook page\n2. Click Follow\n3. Like the latest 3 posts\n4. Take a screenshot",
      requiredProof: "Screenshot of the followed page with your profile visible",
      reward: 5,
      workerLimit: 50,
      categoryId: catMap["social-media"],
      ownerId: employer.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
    {
      title: "YouTube Subscribe & Watch",
      description: "Subscribe to our YouTube channel and watch 2 videos completely.",
      instructions:
        "1. Open the channel link\n2. Subscribe\n3. Watch 2 videos for at least 30 seconds each\n4. Screenshot your subscription",
      requiredProof: "Screenshot showing subscribed state + video watch history",
      reward: 8,
      workerLimit: 100,
      categoryId: catMap["social-media"],
      ownerId: employer.id,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
    {
      title: "Visit Website & Sign Up",
      description: "Visit our website and create a free account.",
      instructions: "1. Click the website link\n2. Register a free account\n3. Verify email\n4. Submit your registered email",
      requiredProof: "Registered email address + screenshot of dashboard",
      reward: 12,
      workerLimit: 30,
      categoryId: catMap["website-visit"],
      ownerId: employer.id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
    {
      title: "Test Mobile App (Android)",
      description: "Download and test our Android app, report any bugs.",
      instructions: "1. Install the app from Play Store\n2. Create account\n3. Use app for 5 minutes\n4. Report experience",
      requiredProof: "Screenshot of installed app + short review text",
      reward: 25,
      workerLimit: 20,
      categoryId: catMap["app-testing"],
      ownerId: employer.id,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
    {
      title: "Data Entry - Product List",
      description: "Enter 50 product details from images to spreadsheet.",
      instructions: "1. Download the image pack\n2. Enter product name, price, category\n3. Upload completed sheet",
      requiredProof: "Completed spreadsheet file",
      reward: 50,
      workerLimit: 10,
      categoryId: catMap["data-entry"],
      ownerId: employer.id,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
    {
      title: "Write a Short Review",
      description: "Write a 100-word review about our service.",
      instructions: "1. Visit our service page\n2. Write an honest 100-word review\n3. Submit the text",
      requiredProof: "The review text (100+ words)",
      reward: 15,
      workerLimit: 40,
      categoryId: catMap["content"],
      ownerId: employer.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
    {
      title: "Instagram Post Like",
      description: "Like our latest 5 Instagram posts.",
      instructions: "1. Open our Instagram profile\n2. Like the latest 5 posts\n3. Screenshot your activity",
      requiredProof: "Screenshot of liked posts",
      reward: 6,
      workerLimit: 80,
      categoryId: catMap["social-media"],
      ownerId: employer.id,
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
    {
      title: "Telegram Group Join",
      description: "Join our Telegram support group.",
      instructions: "1. Click the invite link\n2. Join the group\n3. Stay for verification",
      requiredProof: "Your Telegram username",
      reward: 4,
      workerLimit: 200,
      categoryId: catMap["social-media"],
      ownerId: employer.id,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  ];

  for (const job of sampleJobs) {
    await db.job.create({ data: job });
  }

  // Create a sample submission from worker for a job
  const firstJob = await db.job.findFirst();
  if (firstJob) {
    await db.jobSubmission.create({
      data: {
        jobId: firstJob.id,
        userId: worker.id,
        status: "PENDING",
        textProof: "Completed the follow task. My Facebook username: demo.worker",
      },
    });
    await db.job.update({
      where: { id: firstJob.id },
      data: { completedCount: { increment: 1 } },
    });
  }

  // Sample transactions for worker
  await db.transaction.createMany({
    data: [
      {
        userId: worker.id,
        type: "DEPOSIT",
        amount: 200,
        description: "Welcome bonus",
        balanceAfter: 200,
      },
      {
        userId: worker.id,
        type: "JOB_EARN",
        amount: 50,
        description: "Job completed: Data Entry",
        balanceAfter: 250,
      },
      {
        userId: worker.id,
        type: "JOB_EARN",
        amount: 30,
        description: "Pending: Facebook Follow",
        balanceAfter: 280,
      },
    ],
  });

  // Welcome notification
  await db.notification.create({
    data: {
      userId: worker.id,
      title: "Amar Earning-এ স্বাগতম!",
      message: "আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। কাজ শুরু করুন।",
      type: "ANNOUNCEMENT",
    },
  });

  console.log("Seed completed. Admin: admin@amarearning.com / admin123");
}

async function ensureCategories() {
  const cats = [
    { name: "Facebook", slug: "facebook", icon: "Facebook" },
    { name: "Telegram", slug: "telegram", icon: "Send" },
    { name: "Gmail", slug: "gmail", icon: "Mail" },
    { name: "Identity Verification", slug: "identity-verification", icon: "ShieldCheck" },
    { name: "Mobile Application", slug: "mobile-application", icon: "Smartphone" },
    { name: "Review", slug: "review", icon: "Star" },
    { name: "Tiktok", slug: "tiktok", icon: "Music" },
    { name: "Whatsapp", slug: "whatsapp", icon: "MessageCircle" },
    { name: "Youtube", slug: "youtube", icon: "Youtube" },
    { name: "Twitter", slug: "twitter", icon: "Twitter" },
    { name: "Toffee", slug: "toffee", icon: "Tv" },
    { name: "Snapchat", slug: "snapchat", icon: "Camera" },
    { name: "Airdrop/Offer Join", slug: "airdrop-offer-join", icon: "Gift" },
    { name: "Answer", slug: "answer", icon: "MessageSquare" },
  ];
  for (const c of cats) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, icon: c.icon },
    });
  }

  // Seed job types for each category
  const jobTypesData: Record<string, Array<{ title: string; reward: number }>> = {
    facebook: [
      { title: "Facebook Page Follow + Invite", reward: 2 },
      { title: "Facebook Post Share + Comment + Like", reward: 2 },
      { title: "Facebook Birthday Wish", reward: 2 },
      { title: "Facebook Group Join", reward: 2 },
      { title: "Facebook Page Invite 100", reward: 2 },
      { title: "Facebook Page Invite 500", reward: 2 },
      { title: "Facebook Page Invite 1000", reward: 2 },
      { title: "Facebook Id Create", reward: 5 },
      { title: "Facebook Report", reward: 2 },
    ],
    telegram: [
      { title: "Telegram Channel Join", reward: 2 },
      { title: "Telegram Group Join", reward: 2 },
      { title: "Telegram Group Post", reward: 2 },
    ],
    gmail: [
      { title: "New Gmail Account", reward: 6 },
      { title: "Old Gmail Account", reward: 8 },
      { title: "Own Info Gmail Create", reward: 8 },
    ],
    "identity-verification": [
      { title: "Application", reward: 40 },
      { title: "Other KYC Verification", reward: 40 },
      { title: "Website", reward: 40 },
    ],
    "mobile-application": [
      { title: "Download and create", reward: 9 },
      { title: "Download and visit", reward: 7 },
      { title: "Download + install", reward: 6 },
      { title: "Download + install + review", reward: 7 },
      { title: "Download Only", reward: 5 },
    ],
    review: [
      { title: "Facebook Review", reward: 2 },
      { title: "Google Map Review", reward: 3 },
      { title: "Play Store Review", reward: 3 },
    ],
    tiktok: [
      { title: "Follow", reward: 2 },
      { title: "Save", reward: 2 },
      { title: "Live Join 1-5 min", reward: 3 },
      { title: "Create a Video", reward: 20 },
      { title: "Comment", reward: 2 },
      { title: "Like + Follow", reward: 2 },
    ],
    whatsapp: [
      { title: "Join a Channel", reward: 2 },
      { title: "Join a Group", reward: 2 },
    ],
    youtube: [
      { title: "Comment", reward: 2 },
      { title: "Subscribe", reward: 2 },
      { title: "Like", reward: 2 },
      { title: "Like + Comment", reward: 2.4 },
      { title: "Create a Video", reward: 100 },
      { title: "Reels & Short", reward: 2 },
      { title: "Watchtime 1-3 min + ads view", reward: 3 },
      { title: "Watch Video 1-25 min", reward: 6 },
      { title: "Watch Video + Subscribe", reward: 3 },
      { title: "Watch Video 1-30 min", reward: 16 },
      { title: "Watch Video 1-8 min", reward: 8 },
      { title: "Like + Comment + Subscribe + Share", reward: 3 },
      { title: "Watch Video 1-5 min + Subscribe + Share", reward: 4 },
      { title: "Share a Video", reward: 2 },
      { title: "Gmail Account + Channel Create", reward: 14 },
    ],
    twitter: [
      { title: "Connect", reward: 2 },
      { title: "Favourite", reward: 2 },
      { title: "Follow", reward: 2 },
      { title: "Follow + Favourite + Retweet", reward: 2 },
      { title: "Follow + Like", reward: 2 },
      { title: "New Twitter Account", reward: 8 },
      { title: "Old Twitter Account", reward: 8 },
      { title: "Share a Post", reward: 2 },
      { title: "Re-Tweet", reward: 2 },
    ],
    toffee: [
      { title: "Comment", reward: 2 },
      { title: "Follow", reward: 2 },
      { title: "Like", reward: 2 },
      { title: "Watch Video 1-10 min", reward: 3 },
      { title: "Watch Video 1-20 min", reward: 4 },
      { title: "Views", reward: 2 },
    ],
    snapchat: [
      { title: "Follow", reward: 2 },
    ],
    "airdrop-offer-join": [
      { title: "Vote", reward: 2 },
      { title: "Exchanger Offer", reward: 25 },
      { title: "Others", reward: 20 },
      { title: "Red Pack Claim", reward: 3 },
    ],
    answer: [
      { title: "Answer Only", reward: 3 },
      { title: "Long Answer + Link (30+ words)", reward: 3 },
      { title: "Short Answer + Link (up to 30 words)", reward: 5 },
    ],
  };

  for (const [slug, types] of Object.entries(jobTypesData)) {
    const category = await db.category.findUnique({ where: { slug } });
    if (!category) continue;
    for (const jt of types) {
      const existing = await db.jobType.findFirst({
        where: { title: jt.title, categoryId: category.id },
      });
      if (!existing) {
        await db.jobType.create({
          data: { title: jt.title, reward: jt.reward, categoryId: category.id },
        });
      } else {
        await db.jobType.update({
          where: { id: existing.id },
          data: { reward: jt.reward },
        });
      }
    }
  }
}

async function ensureSettings() {
  const settings = [
    { key: "websiteName", value: "Amar Earning" },
    { key: "primaryColor", value: "#22c55e" },
    { key: "minWithdrawal", value: "50" },
    { key: "paymentMethods", value: "BKASH,NAGAD,ROCKET" },
    { key: "jobApprovalRequired", value: "true" },
    { key: "serviceCharge", value: "8" },
    { key: "withdrawalFee", value: "3" },
    { key: "maintenanceMode", value: "false" },
  ];
  for (const s of settings) {
    await db.setting.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value },
    });
  }
}

async function ensureAdmin() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    const password = await hashPassword("admin123");
    await db.user.create({
      data: {
        name: "Admin",
        username: "admin",
        email: "admin@amarearning.com",
        passwordHash: password,
        role: "ADMIN",
        referralCode: "ADMIN001",
        wallet: {
          create: { balance: 100000 },
        },
      },
    });
  }
}
