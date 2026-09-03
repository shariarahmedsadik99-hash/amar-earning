# Amar Earning — Micro-Job Platform

একটি সহজ ও বিশ্বস্ত বাংলাদেশী মাইক্রো-জব প্ল্যাটফর্ম। ছোট ছোট কাজ করে সহজেই আয় করুন।

## 🚀 Live Demo
[Deploy করার পর এখানে link দিন]

## ✨ Features

- **14 Categories** — Facebook, YouTube, Telegram, Gmail, TikTok, Twitter ইত্যাদি
- **72+ Job Types** — প্রতিটি কাজের নির্দিষ্ট মূল্য নির্ধারিত
- **Job Approval System** — অ্যাডমিন ভেরিফাই করার পর কাজ লাইভ হয়
- **Payment Gateway** — bKash, Nagad, Rocket (অ্যাডমিন কাস্টমাইজ করতে পারে)
- **Deposit System** — ম্যানুয়াল ভেরিফিকেশন সহ
- **Withdrawal System** — ৫% ফি, ৪-ডিজিট PIN নিরাপত্তা
- **Referral System** — ২% লাইফটাইম কমিশন + ২০৳ সাইনআপ বোনাস
- **Admin Panel** — ইউজার, কাজ, সাবমিশন, উইথড্র, ডিপোজিট ম্যানেজমেন্ট
- **Gamification** — ব্যাজ, লিডারবোর্ড, অ্যাচিভমেন্ট প্রগ্রেস
- **Bangla + English** — বাংলা ডিফল্ট, English সাপোর্ট
- **Dark Mode** — সম্পূর্ণ dark/light theme
- **Mobile-First** — মোবাইল ও ডেস্কটপ রেসপন্সিভ

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** Turso (libSQL)
- **ORM:** Prisma
- **Font:** Noto Sans Bengali (Google Fonts)

## 📦 Installation

```bash
# Clone
git clone https://github.com/shariarahmedsadik99-hash/amar-earning.git
cd amar-earning

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your Turso credentials

# Push database schema
bun run db:push

# Seed database
curl -X POST http://localhost:3000/api/seed

# Run dev server
bun run dev
```

## 🔑 Environment Variables

```env
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-turso-auth-token
JWT_SECRET=your-secret-key
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## 👤 Demo Accounts

- **Admin:** admin@amarearning.com / admin123
- **Worker:** worker@amarearning.com / worker123
- **Employer:** employer@amarearning.com / employer123

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page (hash router)
├── components/
│   ├── admin/             # Admin panel
│   ├── shared/            # Shared components
│   └── views/             # Page views
├── lib/                   # Utilities, auth, db, i18n
└── prisma/                # Database schema
```

## 📄 License

MIT License

## 🤝 Contact

- GitHub: [@shariarahmedsadik99-hash](https://github.com/shariarahmedsadik99-hash)

---

**কাজ করুন, আয় করুন।**
