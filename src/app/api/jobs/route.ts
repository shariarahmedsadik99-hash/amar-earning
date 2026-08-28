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

    const totalBudget = rewardNum * workersNum;

    // Check balance
    const wallet = await db.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || wallet.balance < totalBudget) {
      return NextResponse.json(
        { error: "আপনার ব্যালেন্স এই কাজটি পোস্ট করার জন্য যথেষ্ট নয়।" },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const initialStatus = settings.jobApprovalRequired ? "PENDING" : "ACTIVE";

    // Debit the wallet
    await debitWallet(user.id, totalBudget, "JOB_SPEND", `কাজ পোস্ট: ${title}`);

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

    await db.notification.create({
      data: {
        userId: user.id,
        title: "কাজ পোস্ট সফল",
        message: `"${title}" কাজটি সফলভাবে পোস্ট হয়েছে। ${totalBudget}৳ কেটে নেওয়া হয়েছে।`,
        type: "ANNOUNCEMENT",
      },
    });

    return NextResponse.json({ ok: true, job });
  } catch (e) {
    console.error("Create job error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
