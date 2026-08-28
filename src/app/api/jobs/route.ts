import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { debitWallet } from "@/lib/wallet";
import { getSettings } from "@/lib/settings";

// Get single job
export async function GET(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const job = await db.job.findUnique({
      where: { id },
      include: {
        category: true,
        owner: { select: { name: true, username: true } },
        _count: { select: { submissions: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if current user already submitted
    const user = await getCurrentUser();
    let mySubmission = null;
    if (user) {
      mySubmission = await db.jobSubmission.findUnique({
        where: { jobId_userId: { jobId: id, userId: user.id } },
      });
    }

    return NextResponse.json({ job, mySubmission, currentUserId: user?.id ?? null });
  } catch (e) {
    console.error("Job fetch error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Create a job
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      instructions,
      requiredProof,
      reward,
      workerLimit,
      categoryId,
      deadline,
    } = body;

    if (!title || !description || !instructions || !requiredProof || !categoryId || !deadline) {
      return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
    }

    const rewardNum = parseFloat(reward);
    const workersNum = parseInt(workerLimit);
    if (isNaN(rewardNum) || rewardNum < 1) {
      return NextResponse.json({ error: "পুরস্কার সঠিক নয়" }, { status: 400 });
    }
    if (isNaN(workersNum) || workersNum < 1) {
      return NextResponse.json({ error: "কর্মী সংখ্যা সঠিক নয়" }, { status: 400 });
    }

    const settings = await getSettings();
    const serviceCharge = settings.serviceCharge;
    const totalBudget = rewardNum * workersNum + serviceCharge;

    // Check balance (including service charge)
    const wallet = await db.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || wallet.balance < totalBudget) {
      return NextResponse.json(
        { error: "আপনার ব্যালেন্স এই কাজটি পোস্ট করার জন্য যথেষ্ট নয়।" },
        { status: 400 }
      );
    }

    // Job always starts as PENDING — admin must approve before it goes live
    const initialStatus = "PENDING";

    // Debit the wallet (job budget + service charge)
    await debitWallet(user.id, totalBudget, "JOB_SPEND", `কাজ পোস্ট: ${title} (সার্ভিস চার্জ ৳${serviceCharge} সহ)`);

    const job = await db.job.create({
      data: {
        title,
        description,
        instructions,
        requiredProof,
        reward: rewardNum,
        workerLimit: workersNum,
        categoryId,
        ownerId: user.id,
        deadline: new Date(deadline),
        status: initialStatus,
      },
    });

    // Notify the job owner
    await db.notification.create({
      data: {
        userId: user.id,
        title: "কাজ পোস্ট সফল — অনুমোদনের অপেক্ষায়",
        message: `"${title}" কাজটি সফলভাবে পোস্ট হয়েছে। ৳${totalBudget} (৳${rewardNum * workersNum} + ৳${serviceCharge} সার্ভিস চার্জ) কেটে নেওয়া হয়েছে। অ্যাডমিন অনুমোদনের পর কাজটি লাইভ হবে।`,
        type: "ANNOUNCEMENT",
      },
    });

    // Notify all admins about the new job pending approval
    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "নতুন কাজ অনুমোদনের অপেক্ষায়",
          message: `"${title}" কাজটি অনুমোদনের অপেক্ষায় আছে। রিভিউ করুন।`,
          type: "ANNOUNCEMENT",
        },
      });
    }

    return NextResponse.json({ ok: true, job });
  } catch (e) {
    console.error("Create job error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
