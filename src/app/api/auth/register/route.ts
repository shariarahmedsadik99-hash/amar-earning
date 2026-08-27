import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { creditWallet } from "@/lib/wallet";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, password, confirmPassword, referralCode } = body;

    // Validation
    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "সব ফিল্ড পূরণ করুন" }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "পাসওয়ার্ড মেলে না" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }, { status: 400 });
    }
    if (username.length < 3) {
      return NextResponse.json({ error: "ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে" }, { status: 400 });
    }

    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "এই ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে" }, { status: 400 });
    }
    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হয়েছে" }, { status: 400 });
    }

    let referrerId: string | undefined;
    if (referralCode) {
      const referrer = await db.user.findUnique({ where: { referralCode } });
      if (referrer) referrerId = referrer.id;
    }

    const passwordHash = await hashPassword(password);
    const newReferralCode = "AE" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await db.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        referralCode: newReferralCode,
        referredById: referrerId,
        wallet: {
          create: {
            balance: 50,
            totalEarned: 50,
          },
        },
      },
    });

    await db.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount: 50,
        description: "সাইনআপ বোনাস",
        balanceAfter: 50,
      },
    });

    if (referrerId) {
      await creditWallet(referrerId, 20, "REFERRAL_BONUS", `রেফারেল বোনাস: ${username}`);
      await db.notification.create({
        data: {
          userId: referrerId,
          title: "রেফারেল বোনাস!",
          message: `${name} আপনার রেফারেলে যুক্ত হয়েছেন। ৳২০ বোনাস পেয়েছেন।`,
          type: "ANNOUNCEMENT",
        },
      });
    }

    await db.notification.create({
      data: {
        userId: user.id,
        title: "Amar Earning-এ স্বাগতম!",
        message: "আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। ৳৫০ সাইনআপ বোনাস পেয়েছেন।",
        type: "ANNOUNCEMENT",
      },
    });

    await createSession(user.id);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
