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
    { name: "Social Media", slug: "social-media", icon: "Share2" },
    { name: "Website Visit", slug: "website-visit", icon: "Globe" },
    { name: "App Testing", slug: "app-testing", icon: "Smartphone" },
    { name: "Data Entry", slug: "data-entry", icon: "Table" },
    { name: "Content", slug: "content", icon: "PenLine" },
    { name: "Other", slug: "other", icon: "Briefcase" },
  ];
  for (const c of cats) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, icon: c.icon },
    });
  }
}

async function ensureSettings() {
  const settings = [
    { key: "websiteName", value: "Amar Earning" },
    { key: "primaryColor", value: "#22c55e" },
    { key: "minWithdrawal", value: "100" },
    { key: "paymentMethods", value: "BKASH,NAGAD,ROCKET" },
    { key: "jobApprovalRequired", value: "false" },
    { key: "maintenanceMode", value: "false" },
  ];
  for (const s of settings) {
    await db.setting.upsert({
      where: { key: s.key },
      create: s,
      update: {},
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
