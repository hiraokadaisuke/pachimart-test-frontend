import { DEV_USER_IDS } from "@/lib/dev-user/users";

const USER_A_ID = DEV_USER_IDS.A;
const USER_B_ID = DEV_USER_IDS.B;

export const dummyBalances = [
  { userId: USER_A_ID, plannedPurchase: 1200000, plannedSales: 2100000, available: 1650000 },
  { userId: USER_B_ID, plannedPurchase: 800000, plannedSales: 1800000, available: 990000 },
];

export const dummyTransactions = [
  { id: 1, userId: USER_A_ID, kind: "入金", amount: 500000, date: "2025-12-01" },
  { id: 2, userId: USER_A_ID, kind: "出金", amount: 250000, date: "2025-12-05" },
  { id: 3, userId: USER_B_ID, kind: "入金", amount: 300000, date: "2025-12-02" },
  { id: 4, userId: USER_B_ID, kind: "出金", amount: 150000, date: "2025-12-07" },
];
