import { db } from "./db";

export type AppSettings = {
  websiteName: string;
  primaryColor: string;
  minWithdrawal: number;
  paymentMethods: string[];
  jobApprovalRequired: boolean;
  maintenanceMode: boolean;
  serviceCharge: number;
  withdrawalFeePercent: number;
};

const DEFAULTS: AppSettings = {
  websiteName: "Amar Earning",
  primaryColor: "#22c55e",
  minWithdrawal: 50,
  paymentMethods: ["BKASH", "NAGAD", "ROCKET"],
  jobApprovalRequired: true,
  maintenanceMode: false,
  serviceCharge: 8,
  withdrawalFeePercent: 5,
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return {
    websiteName: map.websiteName ?? DEFAULTS.websiteName,
    primaryColor: map.primaryColor ?? DEFAULTS.primaryColor,
    minWithdrawal: map.minWithdrawal ? parseFloat(map.minWithdrawal) : DEFAULTS.minWithdrawal,
    paymentMethods: map.paymentMethods
      ? map.paymentMethods.split(",").filter(Boolean)
      : DEFAULTS.paymentMethods,
    jobApprovalRequired: map.jobApprovalRequired
      ? map.jobApprovalRequired === "true"
      : DEFAULTS.jobApprovalRequired,
    maintenanceMode: map.maintenanceMode
      ? map.maintenanceMode === "true"
      : DEFAULTS.maintenanceMode,
    serviceCharge: map.serviceCharge ? parseFloat(map.serviceCharge) : DEFAULTS.serviceCharge,
    withdrawalFeePercent: map.withdrawalFeePercent ? parseFloat(map.withdrawalFeePercent) : DEFAULTS.withdrawalFeePercent,
  };
}

export async function setSetting(key: keyof AppSettings, value: string) {
  await db.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export { DEFAULTS };
