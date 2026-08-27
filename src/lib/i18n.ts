export type Lang = "bn" | "en";

export const translations = {
  bn: {
    // Brand
    brandName: "Amar Earning",
    tagline: "কাজ করুন, আয় করুন।",

    // Nav
    nav: {
      jobs: "কাজ",
      howItWorks: "যেভাবে কাজ করে",
      login: "লগইন",
      register: "রেজিস্টার",
      logout: "লগআউট",
      dashboard: "ড্যাশবোর্ড",
      home: "হোম",
      wallet: "ওয়ালেট",
      profile: "প্রোফাইল",
      postJob: "কাজ পোস্ট করুন",
      myJobs: "আমার কাজ",
      mySubmissions: "আমার সাবমিশন",
      withdraw: "উইথড্র",
      availableJobs: "কাজ খুঁজুন",
      admin: "অ্যাডমিন",
    },

    // Hero
    hero: {
      headline: "ছোট ছোট কাজ করুন, সহজেই আয় করুন।",
      description:
        "Amar Earning-এ বিভিন্ন ছোট কাজ সম্পন্ন করে আয় করুন। সহজভাবে কাজ খুঁজুন, কাজ সম্পন্ন করুন এবং আপনার আয় সংগ্রহ করুন।",
      findJobs: "কাজ খুঁজুন",
      postJob: "কাজ পোস্ট করুন",
    },

    // Categories
    categories: {
      title: "কাজের ক্যাটাগরি",
      subtitle: "আপনার পছন্দের ক্যাটাগরি বেছে নিন",
      socialMedia: "সোশ্যাল মিডিয়া",
      websiteVisit: "ওয়েবসাইট ভিজিট",
      appTesting: "অ্যাপ টেস্টিং",
      dataEntry: "ডেটা এন্ট্রি",
      content: "কনটেন্ট",
      other: "অন্যান্য",
    },

    // Jobs
    jobs: {
      title: "সাম্প্রতিক কাজ",
      subtitle: "নতুন কাজগুলো সম্পন্ন করে আয় করুন",
      reward: "পুরস্কার",
      available: "স্লট",
      completed: "সম্পন্ন",
      viewJob: "কাজটি দেখুন",
      startJob: "কাজ শুরু করুন",
      noJobs: "কোনো কাজ পাওয়া যায়নি",
      category: "ক্যাটাগরি",
      workers: "কর্মী",
      deadline: "ডেডলাইন",
      description: "বিবরণ",
      instructions: "নির্দেশনা",
      requiredProof: "প্রয়োজনীয় প্রমাণ",
      viewAll: "সব কাজ দেখুন",
      searchPlaceholder: "কাজ খুঁজুন...",
    },

    // Auth
    auth: {
      registerTitle: "নতুন অ্যাকাউন্ট তৈরি করুন",
      registerSubtitle: "আয় শুরু করতে একটি অ্যাকাউন্ট তৈরি করুন",
      loginTitle: "লগইন করুন",
      loginSubtitle: "আপনার অ্যাকাউন্টে প্রবেশ করুন",
      fullName: "পুরো নাম",
      username: "ইউজারনেম",
      email: "ইমেইল",
      password: "পাসওয়ার্ড",
      confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
      referralCode: "রেফারেল কোড (ঐচ্ছিক)",
      emailOrUsername: "ইমেইল বা ইউজারনেম",
      rememberMe: "আমাকে মনে রাখুন",
      forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
      createAccount: "অ্যাকাউন্ট তৈরি করুন",
      login: "লগইন",
      haveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
      noAccount: "অ্যাকাউন্ট নেই?",
    },

    // Dashboard
    dashboard: {
      balance: "বর্তমান ব্যালেন্স",
      totalEarned: "মোট আয়",
      completedJobs: "সম্পন্ন কাজ",
      pendingJobs: "অপেক্ষমাণ কাজ",
      welcome: "স্বাগতম",
    },

    // Wallet
    wallet: {
      title: "ওয়ালেট",
      availableBalance: "ব্যবহারযোগ্য ব্যালেন্স",
      totalEarned: "মোট আয়",
      totalSpent: "মোট খরচ",
      pendingBalance: "অপেক্ষমাণ ব্যালেন্স",
      transactions: "লেনদেনের ইতিহাস",
      noTransactions: "কোনো লেনদেন নেই",
      transactionType: {
        JOB_EARN: "কাজ সম্পন্ন",
        JOB_SPEND: "কাজ পোস্ট",
        WITHDRAWAL: "উইথড্র",
        REFUND: "রিফান্ড",
        DEPOSIT: "ডিপোজিট",
        REFERRAL_BONUS: "রেফারেল বোনাস",
      },
    },

    // Withdraw
    withdraw: {
      title: "টাকা তুলুন",
      method: "পেমেন্ট মেথড",
      accountNumber: "অ্যাকাউন্ট নম্বর",
      amount: "পরিমাণ",
      submit: "উইথড্র রিকোয়েস্ট করুন",
      minWithdrawal: "সর্বনিম্ন উইথড্র পরিমাণ",
      pendingWithdrawals: "অপেক্ষমাণ উইথড্র",
      history: "উইথড্র ইতিহাস",
      bkash: "বিকাশ",
      nagad: "নগদ",
      rocket: "রকেট",
      noHistory: "কোনো উইথড্র ইতিহাস নেই",
    },

    // Post Job
    postJob: {
      title: "নতুন কাজ পোস্ট করুন",
      jobTitle: "কাজের শিরোনাম",
      category: "ক্যাটাগরি",
      description: "বিবরণ",
      instructions: "ধাপে ধাপে নির্দেশনা",
      rewardPerWorker: "প্রতি কর্মীর পুরস্কার",
      numWorkers: "কর্মী সংখ্যা",
      requiredProof: "প্রয়োজনীয় প্রমাণ",
      deadline: "ডেডলাইন",
      totalBudget: "মোট বাজেট",
      publish: "কাজ প্রকাশ করুন",
      insufficientBalance: "আপনার ব্যালেন্স এই কাজটি পোস্ট করার জন্য যথেষ্ট নয়।",
    },

    // Proof submission
    proof: {
      title: "কাজের প্রমাণ জমা দিন",
      textProof: "টেক্সট প্রমাণ",
      imageProof: "স্ক্রিনশট/ছবি",
      urlProof: "লিংক",
      submit: "প্রমাণ জমা দিন",
      success: "সফলভাবে জমা হয়েছে",
    },

    // Status
    status: {
      pending: "অপেক্ষমাণ",
      approved: "অনুমোদিত",
      rejected: "প্রত্যাখ্যাত",
      active: "চলমান",
      completed: "সম্পন্ন",
      paused: "বিরতি",
      paid: "পরিশোধিত",
    },

    // How it works
    howItWorks: {
      title: "যেভাবে কাজ করে",
      step1Title: "কাজ খুঁজুন",
      step1Desc: "আপনার পছন্দের ক্যাটাগরি থেকে কাজ বেছে নিন",
      step2Title: "কাজ সম্পন্ন করুন",
      step2Desc: "নির্দেশনা অনুসরণ করে কাজ সম্পন্ন করুন",
      step3Title: "প্রমাণ জমা দিন",
      step3Desc: "কাজের প্রমাণ সহ সাবমিট করুন",
      step4Title: "আয় করুন",
      step4Desc: "অনুমোদনের পর ব্যালেন্সে যোগ হবে",
    },

    // Notifications
    notifications: {
      title: "নোটিফিকেশন",
      noNotifications: "কোনো নোটিফিকেশন নেই",
      markAllRead: "সব পড়া হয়েছে চিহ্নিত করুন",
    },

    // Footer
    footer: {
      about: "Amar Earning একটি সহজ ও বিশ্বস্ত মাইক্রো-জব প্ল্যাটফর্ম। ছোট ছোট কাজ করে সহজেই আয় করুন।",
      quickLinks: "দ্রুত লিংক",
      support: "সাপোর্ট",
      contact: "যোগাযোগ",
      terms: "শর্তাবলী",
      privacy: "প্রাইভেসি",
      copyright: "সর্বস্বত্ব সংরক্ষিত।",
    },

    common: {
      loading: "লোড হচ্ছে...",
      save: "সংরক্ষণ",
      cancel: "বাতিল",
      confirm: "নিশ্চিত করুন",
      delete: "মুছুন",
      edit: "সম্পাদনা",
      approve: "অনুমোদন",
      reject: "প্রত্যাখ্যান",
      view: "দেখুন",
      close: "বন্ধ",
      back: "পিছনে",
      search: "খুঁজুন",
      all: "সব",
      currency: "৳",
    },
  },

  en: {
    brandName: "Amar Earning",
    tagline: "Work and Earn.",

    nav: {
      jobs: "Jobs",
      howItWorks: "How It Works",
      login: "Login",
      register: "Register",
      logout: "Logout",
      dashboard: "Dashboard",
      home: "Home",
      wallet: "Wallet",
      profile: "Profile",
      postJob: "Post a Job",
      myJobs: "My Jobs",
      mySubmissions: "My Submissions",
      withdraw: "Withdraw",
      availableJobs: "Find Jobs",
      admin: "Admin",
    },

    hero: {
      headline: "Do small tasks, earn easily.",
      description:
        "Complete various micro jobs on Amar Earning. Find jobs easily, complete tasks, and collect your earnings.",
      findJobs: "Find Jobs",
      postJob: "Post a Job",
    },

    categories: {
      title: "Job Categories",
      subtitle: "Choose your preferred category",
      socialMedia: "Social Media",
      websiteVisit: "Website Visit",
      appTesting: "App Testing",
      dataEntry: "Data Entry",
      content: "Content",
      other: "Other",
    },

    jobs: {
      title: "Latest Jobs",
      subtitle: "Complete new jobs and earn money",
      reward: "Reward",
      available: "Slots",
      completed: "Completed",
      viewJob: "View Job",
      startJob: "Start Job",
      noJobs: "No jobs found",
      category: "Category",
      workers: "Workers",
      deadline: "Deadline",
      description: "Description",
      instructions: "Instructions",
      requiredProof: "Required Proof",
      viewAll: "View All Jobs",
      searchPlaceholder: "Search jobs...",
    },

    auth: {
      registerTitle: "Create New Account",
      registerSubtitle: "Create an account to start earning",
      loginTitle: "Login",
      loginSubtitle: "Access your account",
      fullName: "Full Name",
      username: "Username",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      referralCode: "Referral Code (optional)",
      emailOrUsername: "Email or Username",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      createAccount: "Create Account",
      login: "Login",
      haveAccount: "Already have an account?",
      noAccount: "Don't have an account?",
    },

    dashboard: {
      balance: "Current Balance",
      totalEarned: "Total Earned",
      completedJobs: "Completed Jobs",
      pendingJobs: "Pending Jobs",
      welcome: "Welcome",
    },

    wallet: {
      title: "Wallet",
      availableBalance: "Available Balance",
      totalEarned: "Total Earned",
      totalSpent: "Total Spent",
      pendingBalance: "Pending Balance",
      transactions: "Transaction History",
      noTransactions: "No transactions yet",
      transactionType: {
        JOB_EARN: "Job Completed",
        JOB_SPEND: "Job Posted",
        WITHDRAWAL: "Withdrawal",
        REFUND: "Refund",
        DEPOSIT: "Deposit",
        REFERRAL_BONUS: "Referral Bonus",
      },
    },

    withdraw: {
      title: "Withdraw Money",
      method: "Payment Method",
      accountNumber: "Account Number",
      amount: "Amount",
      submit: "Request Withdrawal",
      minWithdrawal: "Minimum withdrawal",
      pendingWithdrawals: "Pending Withdrawals",
      history: "Withdrawal History",
      bkash: "bKash",
      nagad: "Nagad",
      rocket: "Rocket",
      noHistory: "No withdrawal history",
    },

    postJob: {
      title: "Post a New Job",
      jobTitle: "Job Title",
      category: "Category",
      description: "Description",
      instructions: "Step-by-step Instructions",
      rewardPerWorker: "Reward per Worker",
      numWorkers: "Number of Workers",
      requiredProof: "Required Proof",
      deadline: "Deadline",
      totalBudget: "Total Budget",
      publish: "Publish Job",
      insufficientBalance: "Your balance is not sufficient to post this job.",
    },

    proof: {
      title: "Submit Job Proof",
      textProof: "Text Proof",
      imageProof: "Screenshot/Image",
      urlProof: "URL/Link",
      submit: "Submit Proof",
      success: "Submitted successfully",
    },

    status: {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      active: "Active",
      completed: "Completed",
      paused: "Paused",
      paid: "Paid",
    },

    howItWorks: {
      title: "How It Works",
      step1Title: "Find a Job",
      step1Desc: "Choose a job from your favorite category",
      step2Title: "Complete the Task",
      step2Desc: "Follow instructions and complete the task",
      step3Title: "Submit Proof",
      step3Desc: "Submit proof of your work",
      step4Title: "Earn Money",
      step4Desc: "Get credited after approval",
    },

    notifications: {
      title: "Notifications",
      noNotifications: "No notifications",
      markAllRead: "Mark all as read",
    },

    footer: {
      about: "Amar Earning is a simple and trustworthy micro-job platform. Earn easily by doing small tasks.",
      quickLinks: "Quick Links",
      support: "Support",
      contact: "Contact",
      terms: "Terms",
      privacy: "Privacy",
      copyright: "All rights reserved.",
    },

    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      delete: "Delete",
      edit: "Edit",
      approve: "Approve",
      reject: "Reject",
      view: "View",
      close: "Close",
      back: "Back",
      search: "Search",
      all: "All",
      currency: "৳",
    },
  },
} as const;

export type TranslationKeys = typeof translations.bn;
